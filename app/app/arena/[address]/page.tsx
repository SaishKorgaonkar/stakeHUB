'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
  isPrivate: boolean;
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
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [inviteInput, setInviteInput] = useState('');
  const [joiningArena, setJoiningArena] = useState(false);


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
      if (!response.ok) {
        throw new Error('Arena not found');
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setArena(data);
      setLoading(false);

      // Check access for private arenas
      if (data.isPrivate && userAddress) {
        const res = await fetch(`/api/arenas/${address}/join?wallet=${userAddress}`);
        const { hasAccess: access } = await res.json();
        setHasAccess(access);
      } else {
        setHasAccess(true); // public arenas always accessible
      }

    } catch (error) {
      console.error('Error fetching arena:', error);
      toast.error('Failed to load arena');
      setLoading(false);
    }
  }

  async function handleJoinPrivate() {
    if (!inviteInput || !userAddress) return;
    setJoiningArena(true);
    try {
      const res = await fetch(`/api/arenas/${address}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteInput, walletAddress: userAddress }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHasAccess(true);
        toast.success('✅ Access granted!');
      } else {
        toast.error(data.error || 'Invalid invite code');
      }
    } catch {
      toast.error('Failed to validate code');
    } finally {
      setJoiningArena(false);
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

  async function handleResolve(winningOutcomeIndex: number) {
    try {
      writeContract({
        address,
        abi: ARENA_ABI,
        functionName: 'resolve',
        args: [winningOutcomeIndex],
      });
      toast.success(`Resolving with outcome: ${arena?.outcomes[winningOutcomeIndex]} ⚡`);
    } catch (error: any) {
      toast.error(error.message || 'Resolve failed');
    }
  }

  if (loading || !arena || !arena.state) {
    return (
      <div className="min-h-screen bg-offwhite">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <LoadingSkeleton />
        </main>
      </div>
    );
  }

  // Invite gate — show code entry if private and no access yet
  if (arena.isPrivate && hasAccess === false) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-offwhite">
          <Navbar />
          <main className="max-w-md mx-auto px-4 py-24 flex flex-col items-center gap-6">
            <div className="text-6xl">🔒</div>
            <h1 className="text-3xl font-bold uppercase text-center">Private Arena</h1>
            <p className="text-gray-600 text-center">{arena.title}</p>
            <div className="w-full bg-white border-4 border-black p-6 brutal-shadow">
              <p className="font-bold uppercase mb-3">Enter Invite Code</p>
              <div className="flex gap-3">
                <input
                  className="flex-1 border-3 border-black px-3 py-2 uppercase font-mono text-lg tracking-widest focus:outline-none"
                  placeholder="ABC123"
                  value={inviteInput}
                  onChange={e => setInviteInput(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinPrivate}
                  disabled={inviteInput.length !== 6 || joiningArena}
                >
                  {joiningArena ? '...' : 'Join'}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (hasAccess === null && arena.isPrivate) {
    // Still checking access
    return (
      <div className="min-h-screen bg-offwhite">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-12"><LoadingSkeleton /></main>
      </div>
    );
  }

  const totalPool = Number(arena.totalPool);
  const isOpen = arena.state === 'OPEN';
  const isLocked = arena.state === 'LOCKED';
  const isResolved = arena.state === 'RESOLVED';
  const isPastDeadline = new Date() > new Date(arena.deadline);
  const isCreator = userAddress?.toLowerCase() === arena.creator.walletAddress.toLowerCase();
  const userWon = isResolved && arena.stakes.some(
    (s) => s.staker.walletAddress.toLowerCase() === userAddress?.toLowerCase() &&
      s.outcomeIndex === arena.winningOutcome
  );

  return (
    <ProtectedRoute>
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
                  className={`${isOpen && selectedOutcome === index ? 'bg-yellow' : 'bg-white'
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

          {/* Creator Resolve Panel — shown after deadline, only to creator */}
          {isCreator && (isLocked || (isOpen && isPastDeadline)) && !isResolved && (
            <Card className="mb-8 border-4 border-black bg-yellow">
              <CardHeader>
                <h3 className="text-xl font-bold uppercase">⚖️ Resolve Arena (Creator Only)</h3>
              </CardHeader>
              <CardBody>
                <p className="mb-4 text-sm">
                  The deadline has passed. Pick the correct outcome to distribute winnings.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {arena.outcomes.map((outcome, index) => (
                    <Button
                      key={index}
                      onClick={() => handleResolve(index)}
                      disabled={isPending || isConfirming}
                      size="lg"
                      className={index === 0 ? 'bg-lime' : 'bg-coral text-white'}
                    >
                      {isPending || isConfirming ? 'Confirming...' : `✓ ${outcome} Won`}
                    </Button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-700">
                  ⚠️ This is irreversible — choose carefully.
                </p>
              </CardBody>
            </Card>
          )}

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
                      className={`flex items-center justify-between p-3 ${i % 2 === 0 ? 'bg-gray-100' : 'bg-white'
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
    </ProtectedRoute>
  );
}
