import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  state: z.enum(['OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED']).nullable().optional(),
  creator: z.string().nullable().optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

/**
 * GET /api/arenas - List arenas with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      state: searchParams.get('state'),
      creator: searchParams.get('creator'),
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    });

    const where: any = {};
    if (query.state) where.state = query.state;
    if (query.creator) where.creatorAddress = query.creator.toLowerCase();

    const [arenas, total] = await Promise.all([
      prisma.arena.findMany({
        where,
        include: {
          creator: {
            select: {
              walletAddress: true,
              username: true,
              pfpUrl: true,
              fid: true,
            },
          },
          stakes: {
            select: {
              amount: true,
              outcomeIndex: true,
              staker: {
                select: {
                  username: true,
                  pfpUrl: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              stakes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.arena.count({ where }),
    ]);

    // Convert BigInt fields to strings for JSON serialization
    const serializedArenas = arenas.map(arena => ({
      ...arena,
      totalPool: arena.totalPool.toString(),
      blockNumber: arena.blockNumber.toString(),
      stakes: arena.stakes.map(stake => ({
        ...stake,
        amount: stake.amount.toString(),
      })),
    }));

    return NextResponse.json({
      arenas: serializedArenas,
      total,
      limit: query.limit,
      offset: query.offset,
    });
  } catch (error) {
    console.error('Error fetching arenas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arenas' },
      { status: 500 }
    );
  }
}
