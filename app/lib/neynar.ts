import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';

export const neynarClient = new NeynarAPIClient(NEYNAR_API_KEY);

/**
 * Get user profile by FID
 */
export async function getUserByFID(fid: number) {
  try {
    const response = await neynarClient.fetchBulkUsers([fid]);
    return response.users[0] || null;
  } catch (error) {
    console.error('Error fetching user by FID:', error);
    return null;
  }
}

/**
 * Get users that a specific FID follows
 */
export async function getUserFollowing(fid: number, limit = 100) {
  try {
    const response = await neynarClient.fetchUserFollowing(fid, {
      limit,
    });
    return response.users;
  } catch (error) {
    console.error('Error fetching following:', error);
    return [];
  }
}

/**
 * Get feed for a user based on their following list
 */
export async function getFeedForUser(fid: number) {
  try {
    const response = await neynarClient.fetchFeed('following', {
      fid,
      limit: 50,
    });
    return response.casts;
  } catch (error) {
    console.error('Error fetching feed:', error);
    return [];
  }
}

/**
 * Send notification to a user
 */
export async function sendNotification(
  notificationUrl: string,
  notificationToken: string,
  title: string,
  body: string
) {
  try {
    const response = await fetch(notificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${notificationToken}`,
      },
      body: JSON.stringify({
        title,
        body,
      }),
    });

    if (!response.ok) {
      throw new Error('Notification failed');
    }

    console.log('✅ Notification sent:', title);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Batch send notifications to multiple users
 */
export async function sendNotificationBatch(
  notifications: Array<{
    url: string;
    token: string;
    title: string;
    body: string;
  }>
) {
  const results = await Promise.allSettled(
    notifications.map((notif) =>
      sendNotification(notif.url, notif.token, notif.title, notif.body)
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  console.log(`📤 Sent ${succeeded}/${notifications.length} notifications`);

  return succeeded;
}
