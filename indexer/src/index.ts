import { createPublicClient, http, parseAbiItem, Log } from 'viem';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

// Monad chain config
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  rpcUrls: {
    default: {
      http: [process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'],
    },
  },
} as const;

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
  batch: {
    multicall: true,
  },
});

// Contract addresses
const ARENA_FACTORY_ADDRESS = process.env.ARENA_FACTORY_ADDRESS as `0x${string}`;
const HUB_TOKEN_ADDRESS = process.env.HUB_TOKEN_ADDRESS as `0x${string}`;

// Polling interval (400ms for Monad's 0.4s block time)
const POLL_INTERVAL = 400;

/**
 * Get or create indexer checkpoint
 */
async function getCheckpoint(contractAddress: string) {
  let checkpoint = await prisma.indexerCheckpoint.findUnique({
    where: { contractAddress },
  });

  if (!checkpoint) {
    const currentBlock = await client.getBlockNumber();
    checkpoint = await prisma.indexerCheckpoint.create({
      data: {
        contractAddress,
        lastBlockNumber: currentBlock - 1000n, // Start from 1000 blocks ago
        lastBlockTimestamp: new Date(),
      },
    });
  }

  return checkpoint;
}

/**
 * Update checkpoint
 */
async function updateCheckpoint(contractAddress: string, blockNumber: bigint) {
  await prisma.indexerCheckpoint.update({
    where: { contractAddress },
    data: {
      lastBlockNumber: blockNumber,
      lastBlockTimestamp: new Date(),
    },
  });
}

/**
 * Process ArenaCreated event
 */
async function processArenaCreated(log: Log) {
  try {
    const { args, blockNumber, transactionHash } = log as any;
    const { arenaAddress, creator, ipfsCid, deadline } = args;

    // Fetch arena details from chain
    const [state, totalPool, outcomesCount] = await Promise.all([
      client.readContract({
        address: arenaAddress,
        abi: [{ type: 'function', name: 'state', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' }],
        functionName: 'state',
      }),
      client.readContract({
        address: arenaAddress,
        abi: [{ type: 'function', name: 'totalPool', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
        functionName: 'totalPool',
      }),
      // Fetch outcomes by trying to read each index until it fails
      (async () => {
        const outcomes = [];
        for (let i = 0; i < 10; i++) {
          try {
            const outcome = await client.readContract({
              address: arenaAddress,
              abi: [
                {
                  type: 'function',
                  name: 'outcomes',
                  inputs: [{ name: 'index', type: 'uint256' }],
                  outputs: [
                    { name: 'label', type: 'string' },
                    { name: 'totalStaked', type: 'uint256' },
                  ],
                  stateMutability: 'view',
                },
              ],
              functionName: 'outcomes',
              args: [BigInt(i)],
            }) as any;
            outcomes.push(outcome.label);
          } catch {
            break;
          }
        }
        return outcomes;
      })(),
    ]);

    // Ensure creator exists
    await prisma.user.upsert({
      where: { walletAddress: creator.toLowerCase() },
      update: { arenasCreated: { increment: 1 } },
      create: {
        walletAddress: creator.toLowerCase(),
        arenasCreated: 1,
      },
    });

    // Create arena
    await prisma.arena.create({
      data: {
        address: arenaAddress.toLowerCase(),
        creatorAddress: creator.toLowerCase(),
        title: `Arena ${arenaAddress.slice(0, 8)}...`, // Fetch from IPFS in real implementation
        ipfsCid,
        outcomes: outcomesCount as string[],
        deadline: new Date(Number(deadline) * 1000),
        state: ['OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED'][Number(state)] as any,
        totalPool: BigInt(totalPool as bigint),
        blockNumber: BigInt(blockNumber),
        transactionHash: transactionHash as string,
      },
    });

    console.log(`✅ Arena created: ${arenaAddress}`);
  } catch (error) {
    console.error('Error processing ArenaCreated:', error);
  }
}

/**
 * Process StakePlaced event
 */
async function processStakePlaced(log: Log, arenaAddress: string) {
  try {
    const { args, blockNumber, transactionHash } = log as any;
    const { staker, outcomeIndex, amount } = args;

    // Ensure staker exists
    await prisma.user.upsert({
      where: { walletAddress: staker.toLowerCase() },
      update: { totalStaked: { increment: BigInt(amount) } },
      create: {
        walletAddress: staker.toLowerCase(),
        totalStaked: BigInt(amount),
      },
    });

    // Create stake
    await prisma.stake.create({
      data: {
        arenaAddress: arenaAddress.toLowerCase(),
        stakerAddress: staker.toLowerCase(),
        outcomeIndex: Number(outcomeIndex),
        amount: BigInt(amount),
        blockNumber: BigInt(blockNumber),
        transactionHash: transactionHash as string,
      },
    });

    // Update arena total pool
    await prisma.arena.update({
      where: { address: arenaAddress.toLowerCase() },
      data: {
        totalPool: { increment: BigInt(amount) },
      },
    });

    console.log(`💰 Stake placed: ${staker} → ${amount} on outcome ${outcomeIndex}`);
  } catch (error) {
    console.error('Error processing StakePlaced:', error);
  }
}

/**
 * Process ArenaResolved event
 */
async function processArenaResolved(log: Log, arenaAddress: string) {
  try {
    const { args } = log as any;
    const { winningOutcome } = args;

    await prisma.arena.update({
      where: { address: arenaAddress.toLowerCase() },
      data: {
        state: 'RESOLVED',
        winningOutcome: Number(winningOutcome),
        resolvedAt: new Date(),
      },
    });

    console.log(`🏆 Arena resolved: ${arenaAddress} → outcome ${winningOutcome} wins`);

    // TODO: Send notifications to stakers
  } catch (error) {
    console.error('Error processing ArenaResolved:', error);
  }
}

/**
 * Process WinningsClaimed event
 */
async function processWinningsClaimed(log: Log, arenaAddress: string) {
  try {
    const { args } = log as any;
    const { winner, amount } = args;

    // Mark stakes as claimed
    await prisma.stake.updateMany({
      where: {
        arenaAddress: arenaAddress.toLowerCase(),
        stakerAddress: winner.toLowerCase(),
      },
      data: { claimed: true },
    });

    // Update user stats
    await prisma.user.update({
      where: { walletAddress: winner.toLowerCase() },
      data: {
        totalWon: { increment: BigInt(amount) },
        reputationScore: { increment: 10 },
      },
    });

    // Log reputation
    await prisma.reputationLog.create({
      data: {
        userAddress: winner.toLowerCase(),
        points: 10,
        reason: 'Claimed winnings',
        arenaAddress: arenaAddress.toLowerCase(),
      },
    });

    console.log(`🎉 Winnings claimed: ${winner} → ${amount}`);
  } catch (error) {
    console.error('Error processing WinningsClaimed:', error);
  }
}

/**
 * Poll for ArenaFactory events
 */
async function pollFactoryEvents() {
  try {
    const checkpoint = await getCheckpoint(ARENA_FACTORY_ADDRESS);
    const currentBlock = await client.getBlockNumber();

    if (currentBlock <= checkpoint.lastBlockNumber) {
      return; // No new blocks
    }

    // Fetch ArenaCreated events
    const logs = await client.getLogs({
      address: ARENA_FACTORY_ADDRESS,
      event: parseAbiItem('event ArenaCreated(address indexed arenaAddress, address indexed creator, string ipfsCid, uint256 deadline, uint256 timestamp)'),
      fromBlock: checkpoint.lastBlockNumber + 1n,
      toBlock: currentBlock,
    });

    for (const log of logs) {
      await processArenaCreated(log);
    }

    await updateCheckpoint(ARENA_FACTORY_ADDRESS, currentBlock);
  } catch (error) {
    console.error('Error polling factory events:', error);
  }
}

/**
 * Poll for Arena events
 */
async function pollArenaEvents() {
  try {
    // Get all arenas
    const arenas = await prisma.arena.findMany({
      select: { address: true },
    });

    for (const arena of arenas) {
      const checkpoint = await getCheckpoint(arena.address);
      const currentBlock = await client.getBlockNumber();

      if (currentBlock <= checkpoint.lastBlockNumber) {
        continue;
      }

      // Fetch all arena events
      const [stakeLogs, resolvedLogs, claimedLogs] = await Promise.all([
        client.getLogs({
          address: arena.address as `0x${string}`,
          event: parseAbiItem('event StakePlaced(address indexed staker, uint8 outcomeIndex, uint256 amount, uint256 timestamp)'),
          fromBlock: checkpoint.lastBlockNumber + 1n,
          toBlock: currentBlock,
        }),
        client.getLogs({
          address: arena.address as `0x${string}`,
          event: parseAbiItem('event ArenaResolved(uint8 winningOutcome, uint256 timestamp)'),
          fromBlock: checkpoint.lastBlockNumber + 1n,
          toBlock: currentBlock,
        }),
        client.getLogs({
          address: arena.address as `0x${string}`,
          event: parseAbiItem('event WinningsClaimed(address indexed winner, uint256 amount)'),
          fromBlock: checkpoint.lastBlockNumber + 1n,
          toBlock: currentBlock,
        }),
      ]);

      for (const log of stakeLogs) {
        await processStakePlaced(log, arena.address);
      }

      for (const log of resolvedLogs) {
        await processArenaResolved(log, arena.address);
      }

      for (const log of claimedLogs) {
        await processWinningsClaimed(log, arena.address);
      }

      await updateCheckpoint(arena.address, currentBlock);
    }
  } catch (error) {
    console.error('Error polling arena events:', error);
  }
}

/**
 * Main indexer loop
 */
async function main() {
  console.log('🚀 StakeHub Indexer starting...');
  console.log(`📡 Connected to Monad RPC: ${monadTestnet.rpcUrls.default.http[0]}`);
  console.log(`📍 Factory Address: ${ARENA_FACTORY_ADDRESS}`);
  console.log(`⏱️  Poll interval: ${POLL_INTERVAL}ms`);

  // Initial sync
  await pollFactoryEvents();
  await pollArenaEvents();

  // Start polling loop
  setInterval(async () => {
    await pollFactoryEvents();
    await pollArenaEvents();
  }, POLL_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down indexer...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down indexer...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start indexer
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
