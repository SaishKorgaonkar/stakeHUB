import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/faucet - Fund a user's wallet for demo purposes
 * In production, this would interact with a treasury wallet
 * For demo, we simulate the funding
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Check if user was already funded
    // 2. Send actual MON tokens from a treasury wallet
    // 3. Log the transaction on-chain
    
    // For demo purposes, we'll simulate success
    const mockTxHash = `0xdemo${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
    const fundAmount = '10.0'; // 10 MON

    return NextResponse.json({
      success: true,
      txHash: mockTxHash,
      amount: fundAmount,
      message: `${fundAmount} MON sent to ${address}`,
    });
  } catch (error) {
    console.error('Faucet error:', error);
    return NextResponse.json(
      { error: 'Faucet request failed' },
      { status: 500 }
    );
  }
}
