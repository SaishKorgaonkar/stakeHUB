import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/arenas/[address] - Get single arena details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const arena = await prisma.arena.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        creator: {
          select: {
            walletAddress: true,
            username: true,
            pfpUrl: true,
            fid: true,
            reputationScore: true,
          },
        },
        stakes: {
          include: {
            staker: {
              select: {
                walletAddress: true,
                username: true,
                pfpUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        winnings: {
          where: { claimed: false },
        },
      },
    });

    if (!arena) {
      return new Response(JSON.stringify({ error: 'Arena not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate outcome totals
    const outcomeTotals = arena.outcomes.map((_, index) => {
      const total = arena.stakes
        .filter((s) => s.outcomeIndex === index)
        .reduce((sum, s) => sum + Number(s.amount), 0);
      return total;
    });

    // Serialize BigInt fields to strings
    const serializedArena = {
      ...arena,
      totalPool: arena.totalPool.toString(),
      stakes: arena.stakes.map(stake => ({
        ...stake,
        amount: stake.amount.toString(),
      })),
      winnings: arena.winnings.map(winning => ({
        ...winning,
        amount: winning.amount.toString(),
      })),
      outcomeTotals,
    };

    return new Response(
      JSON.stringify(serializedArena),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching arena:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch arena' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
