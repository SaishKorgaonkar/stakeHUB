import { PrismaClient } from '@prisma/client';

// Add BigInt serialization support
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Cleaning up existing data...');
  await prisma.stake.deleteMany();
  await prisma.winnings.deleteMany();
  await prisma.reputationLog.deleteMany();
  await prisma.arena.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  console.log('👥 Creating demo users...');
  
  const keone = await prisma.user.create({
    data: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      fid: 12345,
      username: 'keone',
      pfpUrl: 'https://i.imgur.com/placeholder1.jpg',
      reputationScore: 850,
      totalWon: BigInt('5000000000000000000'), // 5 MON
      totalStaked: BigInt('12000000000000000000'), // 12 MON
      arenasCreated: 3,
    },
  });

  const eunice = await prisma.user.create({
    data: {
      walletAddress: '0x2234567890123456789012345678901234567890',
      fid: 23456,
      username: 'eunice',
      pfpUrl: 'https://i.imgur.com/placeholder2.jpg',
      reputationScore: 720,
      totalWon: 3500000000000000000n, // 3.5 MON
      totalStaked: 8000000000000000000n, // 8 MON
      arenasCreated: 2,
    },
  });

  const vitalik = await prisma.user.create({
    data: {
      walletAddress: '0x3234567890123456789012345678901234567890',
      fid: 34567,
      username: 'vitalik',
      pfpUrl: 'https://i.imgur.com/placeholder3.jpg',
      reputationScore: 950,
      totalWon: 8000000000000000000n, // 8 MON
      totalStaked: 15000000000000000000n, // 15 MON
      arenasCreated: 1,
    },
  });

  const anon = await prisma.user.create({
    data: {
      walletAddress: '0x4234567890123456789012345678901234567890',
      fid: 45678,
      username: 'anon_trader',
      pfpUrl: 'https://i.imgur.com/placeholder4.jpg',
      reputationScore: 420,
      totalWon: 1200000000000000000n, // 1.2 MON
      totalStaked: 5000000000000000000n, // 5 MON
      arenasCreated: 0,
    },
  });

  const alice = await prisma.user.create({
    data: {
      walletAddress: '0x5234567890123456789012345678901234567890',
      fid: 56789,
      username: 'alice',
      pfpUrl: 'https://i.imgur.com/placeholder5.jpg',
      reputationScore: 580,
      totalWon: 2000000000000000000n, // 2 MON
      totalStaked: 6000000000000000000n, // 6 MON
      arenasCreated: 1,
    },
  });

  // Create demo arenas
  console.log('🏟️ Creating demo arenas...');

  // Arena 1: OPEN - Monad Mainnet Launch
  const arena1 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000001',
      creatorAddress: keone.walletAddress,
      title: 'Monad Mainnet by Q4 2026?',
      description: 'Will Monad launch mainnet before Q4 2026 ends?',
      ipfsCid: 'QmTest1234567890abcdef',
      outcomes: ['YES', 'NO'],
      deadline: new Date('2026-10-01T00:00:00Z'),
      state: 'OPEN',
      totalPool: BigInt('3500000000000000000n'), // 3.5 MON
      blockNumber: BigInt('1000000n'),
      transactionHash: '0xabc123def456',
    },
  });

  // Add stakes to Arena 1
  await prisma.stake.createMany({
    data: [
      {
        arenaAddress: arena1.address,
        stakerAddress: keone.walletAddress,
        outcomeIndex: 0, // YES
        amount: BigInt('1000000000000000000n'), // 1 MON
        blockNumber: BigInt('1000010n'),
        transactionHash: '0xstake1',
      },
      {
        arenaAddress: arena1.address,
        stakerAddress: vitalik.walletAddress,
        outcomeIndex: 0, // YES
        amount: BigInt('1500000000000000000n'), // 1.5 MON
        blockNumber: BigInt('1000020n'),
        transactionHash: '0xstake2',
      },
      {
        arenaAddress: arena1.address,
        stakerAddress: anon.walletAddress,
        outcomeIndex: 1, // NO
        amount: BigInt('1000000000000000000n'), // 1 MON
        blockNumber: BigInt('1000030n'),
        transactionHash: '0xstake3',
      },
    ],
  });

  // Arena 2: OPEN - ETH/BTC Flip
  const arena2 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000002',
      creatorAddress: vitalik.walletAddress,
      title: 'ETH/BTC Flip by Q4 2026?',
      description: 'Will ETH market cap exceed BTC before end of 2026?',
      ipfsCid: 'QmTest2234567890abcdef',
      outcomes: ['YES - FLIPPENING', 'NO - BTC DOMINANCE'],
      deadline: new Date('2026-12-31T23:59:59Z'),
      state: 'OPEN',
      totalPool: BigInt('5200000000000000000n'), // 5.2 MON
      blockNumber: BigInt('1000100n'),
      transactionHash: '0xabc123def457',
    },
  });

  await prisma.stake.createMany({
    data: [
      {
        arenaAddress: arena2.address,
        stakerAddress: vitalik.walletAddress,
        outcomeIndex: 0, // YES
        amount: BigInt('2000000000000000000n'), // 2 MON
        blockNumber: BigInt('1000110n'),
        transactionHash: '0xstake4',
      },
      {
        arenaAddress: arena2.address,
        stakerAddress: eunice.walletAddress,
        outcomeIndex: 1, // NO
        amount: BigInt('1500000000000000000n'), // 1.5 MON
        blockNumber: BigInt('1000120n'),
        transactionHash: '0xstake5',
      },
      {
        arenaAddress: arena2.address,
        stakerAddress: alice.walletAddress,
        outcomeIndex: 0, // YES
        amount: BigInt('1200000000000000000n'), // 1.2 MON
        blockNumber: BigInt('1000130n'),
        transactionHash: '0xstake6',
      },
      {
        arenaAddress: arena2.address,
        stakerAddress: anon.walletAddress,
        outcomeIndex: 1, // NO
        amount: BigInt('500000000000000000n'), // 0.5 MON
        blockNumber: BigInt('1000140n'),
        transactionHash: '0xstake7',
      },
    ],
  });

  // Arena 3: LOCKED - ETH Denver Afterparty
  const arena3 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000003',
      creatorAddress: eunice.walletAddress,
      title: 'ETH Denver Afterparty Attendance',
      description: 'Will the official afterparty have 500+ attendees?',
      ipfsCid: 'QmTest3234567890abcdef',
      outcomes: ['YES', 'NO'],
      deadline: new Date('2026-02-20T00:00:00Z'), // Past date
      state: 'LOCKED',
      totalPool: BigInt('2800000000000000000n'), // 2.8 MON
      blockNumber: BigInt('1000200n'),
      transactionHash: '0xabc123def458',
    },
  });

  await prisma.stake.createMany({
    data: [
      {
        arenaAddress: arena3.address,
        stakerAddress: eunice.walletAddress,
        outcomeIndex: 0, // YES
        amount: BigInt('1000000000000000000n'), // 1 MON
        blockNumber: BigInt('1000210n'),
        transactionHash: '0xstake8',
      },
      {
        arenaAddress: arena3.address,
        stakerAddress: alice.walletAddress,
        outcomeIndex: 0, // YES
        amount: BigInt('800000000000000000n'), // 0.8 MON
        blockNumber: BigInt('1000220n'),
        transactionHash: '0xstake9',
      },
      {
        arenaAddress: arena3.address,
        stakerAddress: anon.walletAddress,
        outcomeIndex: 1, // NO
        amount: BigInt('1000000000000000000n'), // 1 MON
        blockNumber: BigInt('1000230n'),
        transactionHash: '0xstake10',
      },
    ],
  });

  // Arena 4: RESOLVED - Vitalik Tweet
  const arena4 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000004',
      creatorAddress: keone.walletAddress,
      title: 'Will Vitalik Tweet About ZK Today?',
      description: 'Will @VitalikButerin mention zero-knowledge proofs on Twitter today?',
      ipfsCid: 'QmTest4234567890abcdef',
      outcomes: ['YES', 'NO'],
      deadline: new Date('2026-02-15T23:59:59Z'),
      state: 'RESOLVED',
      totalPool: BigInt('4000000000000000000n'), // 4 MON
      winningOutcome: 0, // YES won
      resolvedAt: new Date('2026-02-16T10:30:00Z'),
      blockNumber: BigInt('1000300n'),
      transactionHash: '0xabc123def459',
    },
  });

  await prisma.stake.createMany({
    data: [
      {
        arenaAddress: arena4.address,
        stakerAddress: keone.walletAddress,
        outcomeIndex: 0, // YES - WINNER
        amount: BigInt('1500000000000000000n'), // 1.5 MON
        blockNumber: BigInt('1000310n'),
        transactionHash: '0xstake11',
        claimed: true,
      },
      {
        arenaAddress: arena4.address,
        stakerAddress: vitalik.walletAddress,
        outcomeIndex: 0, // YES - WINNER
        amount: BigInt('500000000000000000n'), // 0.5 MON
        blockNumber: BigInt('1000320n'),
        transactionHash: '0xstake12',
        claimed: false,
      },
      {
        arenaAddress: arena4.address,
        stakerAddress: anon.walletAddress,
        outcomeIndex: 1, // NO - LOSER
        amount: BigInt('2000000000000000000n'), // 2 MON
        blockNumber: BigInt('1000330n'),
        transactionHash: '0xstake13',
      },
    ],
  });

  // Arena 5: OPEN - Creator Challenge
  const arena5 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000005',
      creatorAddress: alice.walletAddress,
      title: 'I will stream for 24 hours straight',
      description: 'Alice commits to streaming continuously for 24 hours. Betting closes at stream start.',
      ipfsCid: 'QmTest5234567890abcdef',
      outcomes: ['COMPLETES', 'FAILS'],
      deadline: new Date('2026-03-01T00:00:00Z'),
      state: 'OPEN',
      totalPool: BigInt('1800000000000000000n'), // 1.8 MON
      blockNumber: BigInt('1000400n'),
      transactionHash: '0xabc123def460',
    },
  });

  await prisma.stake.createMany({
    data: [
      {
        arenaAddress: arena5.address,
        stakerAddress: eunice.walletAddress,
        outcomeIndex: 0, // COMPLETES
        amount: BigInt('1000000000000000000n'), // 1 MON
        blockNumber: BigInt('1000410n'),
        transactionHash: '0xstake14',
      },
      {
        arenaAddress: arena5.address,
        stakerAddress: anon.walletAddress,
        outcomeIndex: 1, // FAILS
        amount: BigInt('800000000000000000n'), // 0.8 MON
        blockNumber: BigInt('1000420n'),
        transactionHash: '0xstake15',
      },
    ],
  });

  // Arena 6: OPEN - NFT Floor Price
  const arena6 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000006',
      creatorAddress: keone.walletAddress,
      title: 'Pudgy Penguins Floor > 10 ETH by March?',
      description: 'Will Pudgy Penguins NFT floor price exceed 10 ETH before end of March 2026?',
      ipfsCid: 'QmTest6234567890abcdef',
      outcomes: ['YES', 'NO'],
      deadline: new Date('2026-03-31T23:59:59Z'),
      state: 'OPEN',
      totalPool: BigInt('6500000000000000000n'), // 6.5 MON
      blockNumber: BigInt('1000500n'),
      transactionHash: '0xabc123def461',
    },
  });

  await prisma.stake.createMany({
    data: [
      {
        arenaAddress: arena6.address,
        stakerAddress: keone.walletAddress,
        outcomeIndex: 0, // YES
        amount: BigInt('2000000000000000000n'), // 2 MON
        blockNumber: BigInt('1000510n'),
        transactionHash: '0xstake16',
      },
      {
        arenaAddress: arena6.address,
        stakerAddress: vitalik.walletAddress,
        outcomeIndex: 1, // NO
        amount: BigInt('2500000000000000000n'), // 2.5 MON
        blockNumber: BigInt('1000520n'),
        transactionHash: '0xstake17',
      },
      {
        arenaAddress: arena6.address,
        stakerAddress: eunice.walletAddress,
        outcomeIndex: 0, // YES
        amount: BigInt('1500000000000000000n'), // 1.5 MON
        blockNumber: BigInt('1000530n'),
        transactionHash: '0xstake18',
      },
      {
        arenaAddress: arena6.address,
        stakerAddress: alice.walletAddress,
        outcomeIndex: 1, // NO
        amount: BigInt('500000000000000000n'), // 0.5 MON
        blockNumber: BigInt('1000540n'),
        transactionHash: '0xstake19',
      },
    ],
  });

  // Add reputation logs
  console.log('📊 Adding reputation logs...');
  await prisma.reputationLog.createMany({
    data: [
      {
        userAddress: keone.walletAddress,
        points: 100,
        reason: 'Won Arena: Vitalik Tweet',
        arenaAddress: arena4.address,
      },
      {
        userAddress: keone.walletAddress,
        points: 50,
        reason: 'Created Arena: Monad Mainnet Launch',
        arenaAddress: arena1.address,
      },
      {
        userAddress: vitalik.walletAddress,
        points: 80,
        reason: 'High Activity Bonus',
      },
      {
        userAddress: eunice.walletAddress,
        points: 60,
        reason: 'Created Arena: ETH Denver',
        arenaAddress: arena3.address,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`
📈 Summary:
  - ${await prisma.user.count()} users created
  - ${await prisma.arena.count()} arenas created
  - ${await prisma.stake.count()} stakes placed
  - ${await prisma.reputationLog.count()} reputation logs added
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
