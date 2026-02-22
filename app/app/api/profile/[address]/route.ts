import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/profile/[address] - Get user profile and stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    let user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      include: {
        stakes: {
          include: {
            arena: {
              select: {
                title: true,
                state: true,
                outcomes: true,
                winningOutcome: true,
                address: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        createdArenas: {
          select: {
            address: true,
            title: true,
            state: true,
            totalPool: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create user if doesn't exist
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          walletAddress: address.toLowerCase(),
        },
      });

      // Return new user with empty stakes/arenas
      return new Response(
        JSON.stringify({
          ...newUser,
          totalWon: newUser.totalWon.toString(),
          totalStaked: newUser.totalStaked.toString(),
          stakes: [],
          createdArenas: [],
          stats: { wins: 0, losses: 0, winRate: 0 },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate win/loss record
    const resolvedStakes = user.stakes.filter(
      (s) => s.arena.state === 'RESOLVED'
    );
    const wins = resolvedStakes.filter(
      (s) => s.outcomeIndex === s.arena.winningOutcome && s.claimed
    ).length;
    const losses = resolvedStakes.filter(
      (s) => s.outcomeIndex !== s.arena.winningOutcome
    ).length;

    // Convert BigInt fields to strings for JSON serialization
    const serializedUser = {
      ...user,
      totalWon: user.totalWon.toString(),
      totalStaked: user.totalStaked.toString(),
      stakes: user.stakes.map(stake => ({
        ...stake,
        amount: stake.amount.toString(),
      })),
      createdArenas: user.createdArenas.map(arena => ({
        ...arena,
        totalPool: arena.totalPool.toString(),
      })),
    };

    return NextResponse.json({
      ...serializedUser,
      stats: {
        wins,
        losses,
        winRate: resolvedStakes.length > 0 ? (wins / resolvedStakes.length) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
