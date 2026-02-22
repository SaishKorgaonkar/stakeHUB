import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const webhookSchema = z.object({
  type: z.enum(['miniapp_added', 'notifications_enabled', 'notifications_disabled']),
  data: z.object({
    fid: z.number(),
    username: z.string().optional(),
    notificationDetails: z
      .object({
        url: z.string(),
        token: z.string(),
      })
      .optional(),
  }),
});

/**
 * POST /api/farcaster/webhook - Handle Farcaster Mini App events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = webhookSchema.parse(body);

    const { type, data } = payload;

    switch (type) {
      case 'miniapp_added':
        // User added Mini App — upsert User with FID and store notification token if provided
        await prisma.user.upsert({
          where: { fid: data.fid },
          update: {
            username: data.username,
            ...(data.notificationDetails && {
              notificationToken: data.notificationDetails.token,
              notificationUrl: data.notificationDetails.url,
            }),
          },
          create: {
            // walletAddress is required but unknown at this point — use fid as placeholder
            // It will be updated when the user connects their wallet
            walletAddress: `fid:${data.fid}`,
            fid: data.fid,
            username: data.username,
            ...(data.notificationDetails && {
              notificationToken: data.notificationDetails.token,
              notificationUrl: data.notificationDetails.url,
            }),
          },
        });
        console.log(`✅ Mini App added by FID ${data.fid} — user upserted`);
        break;

      case 'notifications_enabled':
        // Store notification token for existing user
        if (data.notificationDetails) {
          const updated = await prisma.user.updateMany({
            where: { fid: data.fid },
            data: {
              notificationToken: data.notificationDetails.token,
              notificationUrl: data.notificationDetails.url,
            },
          });

          // If no user found by FID yet, create a placeholder
          if (updated.count === 0) {
            await prisma.user.upsert({
              where: { fid: data.fid },
              update: {
                notificationToken: data.notificationDetails.token,
                notificationUrl: data.notificationDetails.url,
              },
              create: {
                walletAddress: `fid:${data.fid}`,
                fid: data.fid,
                notificationToken: data.notificationDetails.token,
                notificationUrl: data.notificationDetails.url,
              },
            });
          }

          console.log(`🔔 Notifications enabled for FID ${data.fid}`);
        }
        break;

      case 'notifications_disabled':
        // Clear notification token
        await prisma.user.updateMany({
          where: { fid: data.fid },
          data: {
            notificationToken: null,
            notificationUrl: null,
          },
        });
        console.log(`🔕 Notifications disabled for FID ${data.fid}`);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
