import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/arenas/[address]/stream - Server-Sent Events for real-time updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  // Verify arena exists
  const arena = await prisma.arena.findUnique({
    where: { address: address.toLowerCase() },
  });

  if (!arena) {
    return new Response('Arena not found', { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      const sendUpdate = async () => {
        try {
          const arenaData = await prisma.arena.findUnique({
            where: { address: address.toLowerCase() },
            include: {
              stakes: {
                select: {
                  outcomeIndex: true,
                  amount: true,
                },
              },
            },
          });

          if (arenaData) {
            const outcomeTotals = arenaData.outcomes.map((_, index) => {
              return arenaData.stakes
                .filter((s) => s.outcomeIndex === index)
                .reduce((sum, s) => sum + Number(s.amount), 0);
            });

            const data = {
              totalPool: arenaData.totalPool.toString(),
              state: arenaData.state,
              outcomeTotals,
              lastUpdate: Date.now(),
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          }
        } catch (error) {
          console.error('SSE error:', error);
        }
      };

      // Send initial update
      await sendUpdate();

      // Set up polling (every 2 seconds)
      const intervalId = setInterval(sendUpdate, 2000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
