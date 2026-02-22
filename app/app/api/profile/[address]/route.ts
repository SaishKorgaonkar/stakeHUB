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
      user = await prisma.user.create({
        data: {
          walletAddress: address.toLowerCase(),
        },
        include: {
          stakes: true,
          createdArenas: true,
        },
      });
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

    return NextResponse.json({
      ...user,
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
