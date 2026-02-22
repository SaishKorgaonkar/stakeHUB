'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HUB_TOKEN_ADDRESS, HUB_TOKEN_ABI } from '@/lib/contracts';
import { toast } from 'sonner';

export default function HUBTokenPage() {
  const { address, isConnected } = useAccount();
  const [swapAmount, setSwapAmount] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Read user's HUB balance
  const { data: hubBalance, refetch: refetchBalance } = useReadContract({
    address: HUB_TOKEN_ADDRESS,
    abi: HUB_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read faucet cooldown
  const { data: faucetCooldown, refetch: refetchCooldown } = useReadContract({
    address: HUB_TOKEN_ADDRESS,
    abi: HUB_TOKEN_ABI,
    functionName: 'getFaucetCooldown',
    args: address ? [address] : undefined,
  });

  // Read swap rate
  const { data: hubPerMON } = useReadContract({
    address: HUB_TOKEN_ADDRESS,
    abi: HUB_TOKEN_ABI,
    functionName: 'hubPerMON',
  });

  // Read faucet amount
  const { data: faucetAmount } = useReadContract({
    address: HUB_TOKEN_ADDRESS,
    abi: HUB_TOKEN_ABI,
    functionName: 'FAUCET_AMOUNT',
  });

  // Check if user has fee discount
  const { data: hasFeeDiscount } = useReadContract({
    address: HUB_TOKEN_ADDRESS,
    abi: HUB_TOKEN_ABI,
    functionName: 'hasFeeDiscount',
    args: address ? [address] : undefined,
  });

  // Update cooldown timer
  useEffect(() => {
    if (faucetCooldown) {
      setCooldownTime(Number(faucetCooldown));
      const interval = setInterval(() => {
        setCooldownTime((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [faucetCooldown]);

  async function handleClaimFaucet() {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      writeContract({
        address: HUB_TOKEN_ADDRESS,
        abi: HUB_TOKEN_ABI,
        functionName: 'claimFaucet',
      });
      toast.success('Claim transaction submitted!');
      setTimeout(() => {
        refetchBalance();
        refetchCooldown();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Claim failed');
    }
  }

  async function handleSwap() {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!swapAmount || Number(swapAmount) <= 0) {
      toast.error('Enter a valid MON amount');
      return;
    }

    try {
      writeContract({
        address: HUB_TOKEN_ADDRESS,
        abi: HUB_TOKEN_ABI,
        functionName: 'swapMONForHUB',
        value: parseEther(swapAmount),
      });
      toast.success('Swap transaction submitted!');
      setTimeout(() => {
        refetchBalance();
        setSwapAmount('');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Swap failed');
    }
  }

  const swapRate = hubPerMON ? Number(formatEther(hubPerMON as bigint)) : 1000;
  const userHubBalance = hubBalance ? Number(formatEther(hubBalance as bigint)) : 0;
  const faucetAmountDisplay = faucetAmount ? Number(formatEther(faucetAmount as bigint)) : 100;
  const estimatedHubReceive = swapAmount ? Number(swapAmount) * swapRate : 0;

  const formatCooldown = (seconds: number) => {
    if (seconds <= 0) return 'Ready!';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 uppercase">Get $HUB Tokens</h1>
          <p className="text-xl text-gray-800">
            Claim free tokens or swap MON to unlock fee discounts
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 bg-yellow">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                  Your $HUB Balance
                </p>
                <p className="text-5xl font-bold font-mono">{userHubBalance.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                  Fee Discount Status
                </p>
                {hasFeeDiscount ? (
                  <div className="inline-block px-4 py-2 bg-lime border-3 border-black">
                    <span className="font-bold text-lg">✓ ACTIVE (1% Fee)</span>
                  </div>
                ) : (
                  <div className="inline-block px-4 py-2 bg-white border-3 border-black">
                    <span className="font-bold text-lg">Standard (2% Fee)</span>
                  </div>
                )}
                <p className="text-sm mt-2 text-gray-600">
                  Need ≥1000 $HUB for discount
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Faucet Card */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold uppercase">🚰 Free Faucet</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="bg-lime border-3 border-black p-4">
                  <p className="text-sm font-bold uppercase mb-1">Claim Amount</p>
                  <p className="text-3xl font-bold font-mono">{faucetAmountDisplay} $HUB</p>
                </div>

                <div className="bg-gray-100 border-3 border-black p-4">
                  <p className="text-sm font-bold uppercase mb-1">Cooldown</p>
                  <p className="text-2xl font-bold font-mono">
                    {formatCooldown(cooldownTime)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Can claim once every 24 hours
                  </p>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  variant="secondary"
                  onClick={handleClaimFaucet}
                  disabled={!isConnected || cooldownTime > 0 || isPending || isConfirming}
                >
                  {cooldownTime > 0
                    ? 'Cooldown Active'
                    : isPending || isConfirming
                    ? 'Claiming...'
                    : 'CLAIM FREE $HUB'}
                </Button>

                {!isConnected && (
                  <p className="text-center text-sm text-gray-600">
                    Connect wallet to claim
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Swap Card */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold uppercase">💱 Swap MON → $HUB</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="bg-gray-100 border-3 border-black p-4">
                  <p className="text-sm font-bold uppercase mb-1">Current Rate</p>
                  <p className="text-3xl font-bold font-mono">
                    1 MON = {swapRate.toLocaleString()} $HUB
                  </p>
                </div>

                <Input
                  type="number"
                  placeholder="Amount of MON"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  label="MON Amount"
                />

                {swapAmount && Number(swapAmount) > 0 && (
                  <div className="bg-yellow border-3 border-black p-4">
                    <p className="text-sm font-bold uppercase mb-1">You'll Receive</p>
                    <p className="text-3xl font-bold font-mono">
                      {estimatedHubReceive.toLocaleString()} $HUB
                    </p>
                  </div>
                )}

                <Button
                  fullWidth
                  size="lg"
                  onClick={handleSwap}
                  disabled={
                    !isConnected ||
                    !swapAmount ||
                    Number(swapAmount) <= 0 ||
                    isPending ||
                    isConfirming
                  }
                >
                  {isPending || isConfirming ? 'Swapping...' : 'SWAP MON FOR $HUB'}
                </Button>

                {!isConnected && (
                  <p className="text-center text-sm text-gray-600">
                    Connect wallet to swap
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-2xl font-bold uppercase">💎 Why Get $HUB?</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-lime border-3 border-black flex items-center justify-center text-2xl flex-shrink-0">
                  💰
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Fee Discount</h3>
                  <p className="text-gray-800">
                    Hold ≥1000 $HUB to reduce platform fees from 2% to 1% on all arena
                    resolutions
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow border-3 border-black flex items-center justify-center text-2xl flex-shrink-0">
                  🎯
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Governance Token</h3>
                  <p className="text-gray-800">
                    Future: Vote on protocol changes, arena templates, and fee structure
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-coral border-3 border-black flex items-center justify-center text-2xl flex-shrink-0 text-white">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Staking Rewards</h3>
                  <p className="text-gray-800">
                    Future: Stake $HUB to earn platform revenue share and additional
                    benefits
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* How It Works */}
        <Card className="mt-8 bg-offwhite">
          <CardHeader>
            <h2 className="text-2xl font-bold uppercase">📚 How It Works</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white border-3 border-black flex items-center justify-center font-bold">
                  1
                </div>
                <p>
                  <strong>Claim Faucet:</strong> Get 100 free $HUB every 24 hours
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white border-3 border-black flex items-center justify-center font-bold">
                  2
                </div>
                <p>
                  <strong>Or Swap MON:</strong> Exchange native MON for $HUB at current
                  rate (1 MON = {swapRate.toLocaleString()} $HUB)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white border-3 border-black flex items-center justify-center font-bold">
                  3
                </div>
                <p>
                  <strong>Reach 1000 $HUB:</strong> Automatically unlock 1% fee discount
                  on all your arena creations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white border-3 border-black flex items-center justify-center font-bold">
                  4
                </div>
                <p>
                  <strong>Save Money:</strong> Pay 1% instead of 2% on losing pool when
                  resolving arenas
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
