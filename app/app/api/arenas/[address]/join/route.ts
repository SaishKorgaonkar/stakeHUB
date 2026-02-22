import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/arenas/[address]/join
 * Validates an invite code and records that the user has joined a private arena.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;
        const { inviteCode, walletAddress } = await request.json();

        if (!inviteCode || !walletAddress) {
            return NextResponse.json({ error: 'Missing inviteCode or walletAddress' }, { status: 400 });
        }

        const arena = await prisma.arena.findUnique({
            where: { address: address.toLowerCase() },
            select: { inviteCode: true, isPrivate: true, address: true },
        });

        if (!arena) {
            return NextResponse.json({ error: 'Arena not found' }, { status: 404 });
        }

        if (!arena.isPrivate) {
            // Public arena — no invite needed, just return success
            return NextResponse.json({ success: true });
        }

        if (arena.inviteCode !== inviteCode.toUpperCase().trim()) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 });
        }

        // Upsert invite record — idempotent, safe to call multiple times
        await prisma.arenaInvite.upsert({
            where: {
                arenaAddress_userAddress: {
                    arenaAddress: address.toLowerCase(),
                    userAddress: walletAddress.toLowerCase(),
                },
            },
            update: {},
            create: {
                arenaAddress: address.toLowerCase(),
                userAddress: walletAddress.toLowerCase(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error joining arena:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/arenas/[address]/join?wallet=0x...
 * Check if a wallet has already joined a private arena.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;
        const wallet = request.nextUrl.searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ hasAccess: false });
        }

        const arena = await prisma.arena.findUnique({
            where: { address: address.toLowerCase() },
            select: { isPrivate: true, creatorAddress: true },
        });

        if (!arena || !arena.isPrivate) {
            return NextResponse.json({ hasAccess: true }); // Public arenas always accessible
        }

        // Creator always has access
        if (arena.creatorAddress.toLowerCase() === wallet.toLowerCase()) {
            return NextResponse.json({ hasAccess: true });
        }

        const invite = await prisma.arenaInvite.findUnique({
            where: {
                arenaAddress_userAddress: {
                    arenaAddress: address.toLowerCase(),
                    userAddress: wallet.toLowerCase(),
                },
            },
        });

        return NextResponse.json({ hasAccess: !!invite });
    } catch (error) {
        console.error('Error checking arena access:', error);
        return NextResponse.json({ hasAccess: false });
    }
}
