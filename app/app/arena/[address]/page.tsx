'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSkeleton } from '@/components/ui/Loading';
import { ARENA_ABI } from '@/lib/contracts';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ArenaData {
  address: string;
  title: string;
  description: string;
  state: 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';
  totalPool: string;
  outcomes: string[];
  deadline: string;
  winningOutcome: number | null;
  creator: {
    username: string | null;
    walletAddress: string;
    reputationScore: number;
  };
  stakes: Array<{
    amount: string;
    outcomeIndex: number;
    staker: {
      username: string | null;
      walletAddress: string;
    };
    createdAt: string;
  }>;
  outcomeTotals: number[];
}

export default function ArenaPage() {
  const params = useParams();
  const address = params.address as `0x${string}`;
  const { address: userAddress } = useAccount();
  
  const [arena, setArena] = useState<ArenaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Read user's stakes
  const { data: userStake } = useReadContract({
    address,
    abi: ARENA_ABI,
    functionName: 'stakes',
    args: userAddress ? [userAddress, selectedOutcome] : undefined,
  });

  useEffect(() => {
    fetchArena();
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchArena, 2000);
    return () => clearInterval(interval);
  }, [address]);

  async function fetchArena() {
    try {
      const response = await fetch(`/api/arenas/${address}`);
      const data = await response.json();
      setArena(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching arena:', error);
      toast.error('Failed to load arena');
    }
  }

  async function handleStake() {
    if (!stakeAmount || Number(stakeAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      writeContract({
        address,
        abi: ARENA_ABI,
        functionName: 'stake',
        args: [selectedOutcome],
        value: parseEther(stakeAmount),
      });

      toast.success('Transaction submitted! ⚡ Confirming in ~0.4s');
    } catch (error: any) {
      toast.error(error.message || 'Transaction failed');
    }
  }

  async function handleClaim() {
    try {
      writeContract({
        address,
        abi: ARENA_ABI,
        functionName: 'claim',
      });
      toast.success('Claim transaction submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Claim failed');
    }
  }

  if (loading || !arena) {
    return (
      <div className="min-h-screen bg-offwhite">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <LoadingSkeleton />
        </main>
      </div>
    );
  }

  const totalPool = Number(arena.totalPool);
  const isOpen = arena.state === 'OPEN';
  const isResolved = arena.state === 'RESOLVED';
  const userWon = isResolved && arena.stakes.some(
    (s) => s.staker.walletAddress.toLowerCase() === userAddress?.toLowerCase() &&
           s.outcomeIndex === arena.winningOutcome
  );

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Badge variant={arena.state.toLowerCase() as any}>
              {arena.state}
            </Badge>
            {isOpen && (
              <span className="font-mono font-bold text-lg">
                Ends {formatDistanceToNow(new Date(arena.deadline), { addSuffix: true })}
              </span>
            )}
          </div>
          
          <h1 className="text-5xl font-bold mb-4 uppercase">{arena.title}</h1>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-mono font-bold border-3 border-black">
              {arena.creator.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold">
                @{arena.creator.username || arena.creator.walletAddress.slice(0, 8)}
              </p>
              <p className="text-sm text-gray-600 font-mono">
                Reputation: {arena.creator.reputationScore}
              </p>
            </div>
          </div>

          {arena.description && (
            <p className="mt-4 text-lg text-gray-800">{arena.description}</p>
          )}
        </div>

        {/* Winner Banner */}
        {isResolved && (
          <Card className="mb-6 bg-lime">
            <CardBody>
              <div className="text-center">
                <h2 className="text-3xl font-bold uppercase mb-2">
                  🏆 OUTCOME: {arena.outcomes[arena.winningOutcome!]}
                </h2>
                {userWon && (
                  <Button onClick={handleClaim} size="lg" className="mt-4">
                    Claim Your Winnings
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Outcome Cards */}
          {arena.outcomes.map((outcome, index) => {
            const amount = arena.outcomeTotals[index] || 0;
            const percentage = totalPool > 0 ? (amount / totalPool) * 100 : 50;
            const odds = totalPool > 0 ? (totalPool / amount).toFixed(2) : '1.00';

            return (
              <Card
                key={index}
                className={`${
                  isOpen && selectedOutcome === index ? 'bg-yellow' : 'bg-white'
                } ${isOpen ? 'cursor-pointer' : ''}`}
                onClick={() => isOpen && setSelectedOutcome(index)}
              >
                <CardHeader>
                  <h3 className="text-2xl font-bold uppercase">{outcome}</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold mb-1">IMPLIED ODDS</p>
                      <p className="text-4xl font-bold font-mono">{odds}x</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1">TOTAL STAKED</p>
                      <p className="text-2xl font-bold font-mono">
                        {(amount / 1e18).toFixed(2)} MON
                      </p>
                    </div>
                    {isOpen && selectedOutcome === index && (
                      <div className="pt-4 border-t-3 border-black">
                        <Input
                          type="number"
                          placeholder="Amount (MON)"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          step="0.01"
                          min="0"
                        />
                        <Button
                          fullWidth
                          className="mt-3"
                          onClick={handleStake}
                          disabled={isPending || isConfirming}
                        >
                          {isPending || isConfirming ? 'Confirming...' : 'Stake on This'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Pool Overview */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-bold uppercase">Live Pool</h3>
          </CardHeader>
          <CardBody>
            <p className="text-4xl font-bold font-mono mb-4">
              {(totalPool / 1e18).toFixed(2)} MON
            </p>
            <ProgressBar
              value={arena.outcomeTotals[0] || 0}
              max={totalPool}
              label={arena.outcomes[0]}
              color="lime"
            />
          </CardBody>
        </Card>

        {/* Recent Stakes */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold uppercase">Recent Stakes</h3>
          </CardHeader>
          <CardBody>
            {arena.stakes.length === 0 ? (
              <p className="text-center py-8 text-gray-600">No stakes yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {arena.stakes.map((stake, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 ${
                      i % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-mono font-bold text-sm">
                        {stake.staker.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="font-mono font-semibold">
                        @{stake.staker.username || stake.staker.walletAddress.slice(0, 6)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono">
                        {(Number(stake.amount) / 1e18).toFixed(2)} MON
                      </p>
                      <p className="text-sm text-gray-600">
                        on {arena.outcomes[stake.outcomeIndex]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
