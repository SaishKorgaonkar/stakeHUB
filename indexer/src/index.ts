import { createPublicClient, http, parseAbiItem, Log } from 'viem';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { resolve } from 'path';

// npm run dev always runs from indexer/ (where package.json is), so .env is in cwd
dotenv.config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

// Monad chain config
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
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
    const [state, totalPool, outcomeLabels] = await Promise.all([
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
        const outcomes: string[] = [];
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
            // viem returns tuple as array [label, totalStaked] or object with named fields
            const label = Array.isArray(outcome) ? outcome[0] : outcome.label;
            if (label !== undefined && label !== null) outcomes.push(String(label));
          } catch {
            break;
          }
        }
        return outcomes;
      })(),
    ]);

    // Try to fetch title + privacy settings from IPFS metadata (try two gateways)
    let title = `Arena ${arenaAddress.slice(0, 8)}...`;
    let isPrivate = false;
    let inviteCode: string | undefined;
    const gateways = [
      process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
      'https://dweb.link/ipfs/',
    ];
    for (const gateway of gateways) {
      try {
        const res = await fetch(`${gateway}${ipfsCid}`, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const meta = await res.json() as { title?: string; isPrivate?: boolean; inviteCode?: string };
          if (meta?.title) title = meta.title;
          if (meta?.isPrivate) isPrivate = true;
          if (meta?.inviteCode) inviteCode = meta.inviteCode.toUpperCase();
          break;
        }
      } catch {
        // try next gateway
      }
    }

    // Ensure creator exists
    await prisma.user.upsert({
      where: { walletAddress: creator.toLowerCase() },
      update: { arenasCreated: { increment: 1 } },
      create: {
        walletAddress: creator.toLowerCase(),
        arenasCreated: 1,
      },
    });

    // Create arena — filter out any stray undefined/null from outcomes
    await prisma.arena.create({
      data: {
        address: arenaAddress.toLowerCase(),
        creatorAddress: creator.toLowerCase(),
        title,
        ipfsCid,
        outcomes: (outcomeLabels as string[]).filter((o): o is string => o != null),
        deadline: new Date(Number(deadline) * 1000),
        state: ['OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED'][Number(state)] as any,
        totalPool: BigInt(totalPool as bigint),
        blockNumber: BigInt(blockNumber),
        transactionHash: transactionHash as string,
        isPrivate,
        ...(inviteCode && { inviteCode }),
      },
    });

    console.log(`✅ Arena created: ${arenaAddress} — "${title}" [${(outcomeLabels as string[]).join(', ')}]`);

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

    const arena = await prisma.arena.update({
      where: { address: arenaAddress.toLowerCase() },
      data: {
        state: 'RESOLVED',
        winningOutcome: Number(winningOutcome),
        resolvedAt: new Date(),
      },
      include: {
        stakes: {
          include: {
            staker: {
              select: {
                fid: true,
                notificationToken: true,
                notificationUrl: true,
                walletAddress: true,
              },
            },
          },
        },
      },
    });

    console.log(`🏆 Arena resolved: ${arenaAddress} → outcome ${winningOutcome} wins`);

    // Send Farcaster notifications to all stakers with tokens
    const APP_URL = process.env.APP_URL || 'https://stakehub.xyz';
    const notifications = arena.stakes
      .filter((s) => s.staker.notificationToken && s.staker.notificationUrl)
      .map((s) => {
        const won = s.outcomeIndex === Number(winningOutcome);
        return {
          url: s.staker.notificationUrl!,
          token: s.staker.notificationToken!,
          title: '⚡ Arena Resolved!',
          body: won
            ? `You won! Claim your winnings from "${arena.title}"`
            : `Arena "${arena.title}" has been resolved`,
          targetUrl: `${APP_URL}/arena/${arenaAddress}`,
        };
      });

    // Deduplicate by notification URL
    const unique = Array.from(new Map(notifications.map(n => [n.url, n])).values());

    if (unique.length > 0) {
      console.log(`📤 Sending ${unique.length} notifications...`);
      await Promise.allSettled(
        unique.map(async (n) => {
          try {
            const res = await fetch(n.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${n.token}`,
              },
              body: JSON.stringify({
                notificationId: `arena-resolved-${arenaAddress}`,
                title: n.title,
                body: n.body,
                targetUrl: n.targetUrl,
                tokens: [n.token],
              }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            console.log(`  ✅ Notified token ${n.token.slice(0, 8)}...`);
          } catch (err) {
            console.error(`  ❌ Notification failed:`, err);
          }
        })
      );
    }
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

    // Cap block range to 90 to stay within Monad's 100-block getLogs limit
    const MAX_BLOCK_RANGE = 90n;
    const toBlock = currentBlock < checkpoint.lastBlockNumber + 1n + MAX_BLOCK_RANGE
      ? currentBlock
      : checkpoint.lastBlockNumber + MAX_BLOCK_RANGE;

    // Fetch ArenaCreated events
    const logs = await client.getLogs({
      address: ARENA_FACTORY_ADDRESS,
      event: parseAbiItem('event ArenaCreated(address indexed arenaAddress, address indexed creator, string ipfsCid, uint256 deadline, uint256 timestamp)'),
      fromBlock: checkpoint.lastBlockNumber + 1n,
      toBlock,
    });

    for (const log of logs) {
      await processArenaCreated(log);
    }

    await updateCheckpoint(ARENA_FACTORY_ADDRESS, toBlock);
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

      // Cap block range to 90 to stay within Monad's 100-block getLogs limit
      const MAX_BLOCK_RANGE = 90n;
      const toBlock = currentBlock < checkpoint.lastBlockNumber + 1n + MAX_BLOCK_RANGE
        ? currentBlock
        : checkpoint.lastBlockNumber + MAX_BLOCK_RANGE;

      // Fetch all arena events
      const [stakeLogs, resolvedLogs, claimedLogs] = await Promise.all([
        client.getLogs({
          address: arena.address as `0x${string}`,
          event: parseAbiItem('event StakePlaced(address indexed staker, uint8 outcomeIndex, uint256 amount, uint256 timestamp)'),
          fromBlock: checkpoint.lastBlockNumber + 1n,
          toBlock,
        }),
        client.getLogs({
          address: arena.address as `0x${string}`,
          event: parseAbiItem('event ArenaResolved(uint8 winningOutcome, uint256 timestamp)'),
          fromBlock: checkpoint.lastBlockNumber + 1n,
          toBlock,
        }),
        client.getLogs({
          address: arena.address as `0x${string}`,
          event: parseAbiItem('event WinningsClaimed(address indexed winner, uint256 amount)'),
          fromBlock: checkpoint.lastBlockNumber + 1n,
          toBlock,
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

      await updateCheckpoint(arena.address, toBlock);

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
