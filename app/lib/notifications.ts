import { prisma } from '@/lib/prisma';
import { sendNotificationBatch } from './neynar';

/**
 * Notify stakers when an arena is resolved
 */
export async function notifyArenaResolved(arenaAddress: string) {
  try {
    const arena = await prisma.arena.findUnique({
      where: { address: arenaAddress },
      include: {
        stakes: {
          include: {
            staker: {
              select: {
                fid: true,
                notificationToken: true,
                notificationUrl: true,
              },
            },
          },
        },
      },
    });

    if (!arena) return;

    // Find stakers with notifications enabled
    const notifications = arena.stakes
      .filter(
        (stake) =>
          stake.staker.fid &&
          stake.staker.notificationToken &&
          stake.staker.notificationUrl
      )
      .map((stake) => {
        const won = stake.outcomeIndex === arena.winningOutcome;
        
        return {
          url: stake.staker.notificationUrl!,
          token: stake.staker.notificationToken!,
          title: '⚡ Arena Resolved!',
          body: won
            ? `You won! Claim your winnings from "${arena.title}"`
            : `Arena "${arena.title}" has been resolved`,
        };
      });

    // Remove duplicates by FID
    const uniqueNotifications = Array.from(
      new Map(notifications.map((n) => [n.url, n])).values()
    );

    await sendNotificationBatch(uniqueNotifications);
  } catch (error) {
    console.error('Error sending arena resolved notifications:', error);
  }
}

/**
 * Notify creator when their arena needs resolution
 */
export async function notifyCreatorResolve(arenaAddress: string) {
  try {
    const arena = await prisma.arena.findUnique({
      where: { address: arenaAddress },
      include: {
        creator: {
          select: {
            fid: true,
            notificationToken: true,
            notificationUrl: true,
          },
        },
      },
    });

    if (
      !arena ||
      !arena.creator.notificationToken ||
      !arena.creator.notificationUrl
    ) {
      return;
    }

    await sendNotificationBatch([
      {
        url: arena.creator.notificationUrl,
        token: arena.creator.notificationToken,
        title: '📋 Action Required',
        body: `Your arena "${arena.title}" needs to be resolved`,
      },
    ]);
  } catch (error) {
    console.error('Error sending creator notification:', error);
  }
}

/**
 * Notify when arena is approaching emergency deadline
 */
export async function notifyEmergencyWindow(arenaAddress: string) {
  try {
    const arena = await prisma.arena.findUnique({
      where: { address: arenaAddress },
      include: {
        creator: {
          select: {
            fid: true,
            notificationToken: true,
            notificationUrl: true,
          },
        },
      },
    });

    if (
      !arena ||
      !arena.creator.notificationToken ||
      !arena.creator.notificationUrl
    ) {
      return;
    }

    await sendNotificationBatch([
      {
        url: arena.creator.notificationUrl,
        token: arena.creator.notificationToken,
        title: '⚠️ Urgent: Arena Expiring',
        body: `Arena "${arena.title}" expires in 24h. Resolve now or it will be cancelled.`,
      },
    ]);
  } catch (error) {
    console.error('Error sending emergency notification:', error);
  }
}
