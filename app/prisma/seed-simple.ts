import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seed...');

  // Clear existing data
  console.log('🧹 Cleaning up existing data...');
  await prisma.stake.deleteMany();
  await prisma.winnings.deleteMany();
  await prisma.reputationLog.deleteMany();
  await prisma.arena.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users with minimal BigInt values
  console.log('👥 Creating demo users...');
  
  const keone = await prisma.user.create({
    data: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      fid: 12345,
      username: 'keone',
      pfpUrl: 'https://i.imgur.com/placeholder1.jpg',
      reputationScore: 850,
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
      arenasCreated: 1,
    },
  });

  // Create simple  demo arenas
  console.log('🏟️ Creating demo arenas...');

  const arena1 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000001',
      creatorAddress: keone.walletAddress,
      title: 'Monad Mainnet by Q4 2026?',
      description: 'Will Monad launch mainnet before Q4 2026 ends?',
      ipfsCid: 'QmTest1234567890abcdef1',
      outcomes: ['YES', 'NO'],
      deadline: new Date('2026-10-01T00:00:00Z'),
      state: 'OPEN',
      blockNumber: 1000000,
      transactionHash: '0xabc123def456',
      createdAt: new Date(),
    },
  });

  const arena2 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000002',
      creatorAddress: vitalik.walletAddress,
      title: 'ETH/BTC Flip by Q4 2026?',
      description: 'Will Ethereum market cap surpass Bitcoin by end of 2026?',
      ipfsCid: 'QmTest1234567890abcdef2',
      outcomes: ['YES', 'NO'],
      deadline: new Date('2026-12-31T23:59:59Z'),
      state: 'OPEN',
      blockNumber: 1000100,
      transactionHash: '0xdef456ghi789',
      createdAt: new Date(),
    },
  });

  const arena3 = await prisma.arena.create({
    data: {
      address: '0xa000000000000000000000000000000000000003',
      creatorAddress: eunice.walletAddress,
      title: 'ETH Denver Afterparty Attendance',
      description: 'Will we have 100+ attendees at the StakeHub afterparty?',
      ipfsCid: 'QmTest1234567890abcdef3',
      outcomes: ['100+', '<100'],
      deadline: new Date('2026-03-15T00:00:00Z'),
      state: 'LOCKED',
      blockNumber: 1000200,
      transactionHash: '0xghi789jkl012',
      createdAt: new Date(),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${3} users`);
  console.log(`   - ${3} arenas`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
