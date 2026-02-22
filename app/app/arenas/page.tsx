'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ArenaCardSkeleton } from '@/components/ui/Loading';
import { formatDistanceToNow } from 'date-fns';

interface Arena {
  id: string;
  address: string;
  title: string;
  state: 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';
  totalPool: string;
  outcomes: string[];
  deadline: string;
  creator: {
    username: string | null;
    pfpUrl: string | null;
    walletAddress: string;
  };
  stakes: Array<{
    amount: string;
    outcomeIndex: number;
  }>;
}

export default function ArenasPage() {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'LOCKED' | 'RESOLVED'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArenas();
  }, [filter]);

  async function fetchArenas() {
    setLoading(true);
    try {
      const query = filter === 'ALL' ? '' : `?state=${filter}`;
      const response = await fetch(`/api/arenas${query}`);
      const data = await response.json();
      setArenas(data.arenas || []);
    } catch (error) {
      console.error('Error fetching arenas:', error);
      setArenas([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 uppercase">Prediction Arenas</h1>
          <p className="text-xl text-gray-800">
            Stake on social outcomes with instant 0.4s confirmation ⚡
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['ALL', 'OPEN', 'LOCKED', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`
                px-6 py-3 font-bold uppercase text-sm border-3 border-black
                transition-all duration-100
                ${filter === tab
                  ? 'bg-yellow brutal-shadow translate-y-[2px]'
                  : 'bg-white brutal-shadow hover:translate-y-[2px] hover:shadow-brutal-sm'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Arena Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <ArenaCardSkeleton key={i} />
            ))}
          </div>
        ) : !arenas || arenas.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <p className="text-xl mb-6">No arenas found. Be the first to create one!</p>
                <Link href="/create">
                  <button className="px-8 py-4 bg-yellow border-4 border-black brutal-shadow font-bold uppercase text-lg hover:translate-x-[2px] hover:translate-y-[2px] transition-transform">
                    CREATE ARENA →
                  </button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {arenas.map((arena) => (
              <ArenaCard key={arena.id} arena={arena} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ArenaCard({ arena }: { arena: Arena }) {
  // Calculate outcome totals
  const outcomeTotals = arena.outcomes.map((_, index) => {
    return arena.stakes
      .filter((s) => s.outcomeIndex === index)
      .reduce((sum, s) => sum + Number(s.amount), 0);
  });

  const totalPool = Number(arena.totalPool);
  const deadlineText = formatDistanceToNow(new Date(arena.deadline), { addSuffix: true });

  return (
    <Link href={`/arena/${arena.address}`}>
      <Card hover>
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center font-mono font-bold">
                {arena.creator.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="font-mono font-semibold">
                @{arena.creator.username || arena.creator.walletAddress.slice(0, 6)}
              </span>
            </div>
            <Badge variant={arena.state.toLowerCase() as any}>
              {arena.state}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold">{arena.title}</h3>
        </CardHeader>

        <CardBody>
          {/* Outcome Pool Bars */}
          <div className="space-y-3 mb-4">
            {arena.outcomes.slice(0, 2).map((outcome, index) => {
              const amount = outcomeTotals[index] || 0;
              const percentage = totalPool > 0 ? (amount / totalPool) * 100 : 50;
              
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold uppercase text-sm">{outcome}</span>
                    <span className="font-mono font-bold text-sm">{percentage.toFixed(1)}%</span>
                  </div>
                  <ProgressBar
                    value={amount}
                    max={totalPool}
                    color={index === 0 ? 'lime' : 'coral'}
                    showPercentage={false}
                  />
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono font-bold">
              {(totalPool / 1e18).toFixed(2)} MON
            </span>
            <span className="text-gray-600">
              {arena.state === 'OPEN' ? `Ends ${deadlineText}` : 'Ended'}
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
