'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/Loading';
import { formatDistanceToNow } from 'date-fns';

interface ProfileData {
  walletAddress: string;
  fid: number | null;
  username: string | null;
  pfpUrl: string | null;
  reputationScore: number;
  totalWon: string;
  totalStaked: string;
  arenasCreated: number;
  stakes: Array<{
    amount: string;
    outcomeIndex: number;
    claimed: boolean;
    createdAt: string;
    arena: {
      title: string;
      address: string;
      state: 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';
      outcomes: string[];
      winningOutcome: number | null;
    };
  }>;
  createdArenas: Array<{
    address: string;
    title: string;
    state: string;
    totalPool: string;
    createdAt: string;
  }>;
  stats: {
    wins: number;
    losses: number;
    winRate: number;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [address]);

  async function fetchProfile() {
    try {
      const response = await fetch(`/api/profile/${address}`);
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-offwhite">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <LoadingSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 bg-black text-white flex items-center justify-center font-mono font-bold text-4xl border-4 border-black">
              {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-4xl font-bold uppercase mb-2">
                {profile.username ? `@${profile.username}` : 'Anonymous'}
              </h1>
              <p className="font-mono text-sm text-gray-600">
                {profile.walletAddress}
              </p>
              {profile.fid && (
                <p className="text-sm text-gray-600 mt-1">
                  Farcaster FID: {profile.fid}
                </p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                  Reputation
                </p>
                <p className="text-3xl font-bold font-mono">
                  {profile.reputationScore}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                  Total Staked
                </p>
                <p className="text-3xl font-bold font-mono">
                  {(Number(profile.totalStaked) / 1e18).toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">MON</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                  Total Won
                </p>
                <p className="text-3xl font-bold font-mono text-lime">
                  {(Number(profile.totalWon) / 1e18).toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">MON</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                  Arenas Created
                </p>
                <p className="text-3xl font-bold font-mono">
                  {profile.arenasCreated}
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Win/Loss Record */}
          <Card className="mt-4">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                    W/L Record
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    {profile.stats.wins}W - {profile.stats.losses}L
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                    Win Rate
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    {profile.stats.winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Stake History */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-2xl font-bold uppercase">Stake History</h2>
          </CardHeader>
          <CardBody>
            {profile.stakes.length === 0 ? (
              <p className="text-center py-8 text-gray-600">No stakes yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-3 border-black">
                      <th className="text-left py-3 px-4 font-bold uppercase text-sm">
                        Arena
                      </th>
                      <th className="text-left py-3 px-4 font-bold uppercase text-sm">
                        Outcome
                      </th>
                      <th className="text-right py-3 px-4 font-bold uppercase text-sm">
                        Staked
                      </th>
                      <th className="text-center py-3 px-4 font-bold uppercase text-sm">
                        Result
                      </th>
                      <th className="text-right py-3 px-4 font-bold uppercase text-sm">
                        When
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.stakes.map((stake, i) => {
                      const isResolved = stake.arena.state === 'RESOLVED';
                      const won = isResolved && stake.outcomeIndex === stake.arena.winningOutcome;
                      const lost = isResolved && stake.outcomeIndex !== stake.arena.winningOutcome;

                      return (
                        <tr
                          key={i}
                          className={`${
                            i % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                          } hover:bg-yellow transition-colors`}
                        >
                          <td className="py-3 px-4">
                            <Link
                              href={`/arena/${stake.arena.address}`}
                              className="font-bold hover:underline"
                            >
                              {stake.arena.title}
                            </Link>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {stake.arena.outcomes[stake.outcomeIndex]}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {(Number(stake.amount) / 1e18).toFixed(2)} MON
                          </td>
                          <td className="py-3 px-4 text-center">
                            {won && <Badge variant="resolved">WIN</Badge>}
                            {lost && <Badge variant="cancelled">LOSS</Badge>}
                            {!isResolved && <Badge variant="locked">PENDING</Badge>}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-600">
                            {formatDistanceToNow(new Date(stake.createdAt), {
                              addSuffix: true,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Created Arenas */}
        {profile.createdArenas.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold uppercase">Created Arenas</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {profile.createdArenas.map((arena) => (
                  <Link key={arena.address} href={`/arena/${arena.address}`}>
                    <div className="flex items-center justify-between p-4 bg-gray-100 hover:bg-yellow transition-colors border-2 border-black">
                      <div>
                        <h3 className="font-bold text-lg">{arena.title}</h3>
                        <p className="text-sm text-gray-600 font-mono">
                          {(Number(arena.totalPool) / 1e18).toFixed(2)} MON pool
                        </p>
                      </div>
                      <Badge variant={arena.state.toLowerCase() as any}>
                        {arena.state}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}
