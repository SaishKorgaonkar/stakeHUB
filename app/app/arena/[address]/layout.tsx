import { prisma } from '@/lib/prisma';
import { ReactNode } from 'react';

interface Props {
    params: Promise<{ address: string }>;
    children: ReactNode;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://stakehub.xyz';

/**
 * Server component layout for /arena/[address]
 * Injects the per-arena fc:miniapp meta tag for Warpcast embed cards
 */
export async function generateMetadata({ params }: { params: Promise<{ address: string }> }) {
    const { address } = await params;

    let title = 'StakeHub Arena';
    try {
        const arena = await prisma.arena.findUnique({
            where: { address: address.toLowerCase() },
            select: { title: true },
        });
        if (arena?.title) title = arena.title;
    } catch {
        // DB not available — use default title
    }

    const arenaUrl = `${APP_URL}/arena/${address}`;

    return {
        title: `${title} — StakeHub`,
        description: `Stake MON on the outcome of "${title}" — parimutuel prediction on Monad.`,
        openGraph: {
            title: `⚡ ${title}`,
            description: 'Stake now on StakeHub — 0.4s confirmation on Monad.',
            images: [`${APP_URL}/og-image.png`],
        },
        other: {
            'fc:miniapp': JSON.stringify({
                version: 'next',
                imageUrl: `${APP_URL}/og-image.png`,
                button: {
                    title: '⚡ Stake Now',
                    action: {
                        type: 'launch_miniapp',
                        name: 'StakeHub',
                        url: arenaUrl,
                        splashImageUrl: `${APP_URL}/splash.png`,
                        splashBackgroundColor: '#FAFAF8',
                    },
                },
            }),
        },
    };
}

export default function ArenaLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
