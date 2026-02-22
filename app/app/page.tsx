'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { CustomConnectButton } from '@/components/CustomConnectButton';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

export default function LandingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [liveActivity, setLiveActivity] = useState([
    { user: '@Keone', action: 'staked 500 MON', arena: 'Monad Mainnet by Q4', likelihood: '75%' },
    { user: '@Eunice', action: 'claimed 1,200 MON', arena: 'ETH Denver Afterparty', likelihood: null },
    { user: '@Vitalik', action: 'staked 100 MON', arena: 'ETH/BTC Flip by Q4', likelihood: '62%' },
  ]);

  useEffect(() => {
    if (isConnected && address) {
      checkAndCreateProfile(address);
    }
  }, [isConnected, address]);

  async function checkAndCreateProfile(walletAddress: string) {
    setIsCheckingProfile(true);
    try {
      const response = await fetch(`/api/profile/${walletAddress}`);

      if (response.ok) {
        router.push('/arenas');
      } else {
        await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });
        router.push('/arenas');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      router.push('/arenas');
    } finally {
      setIsCheckingProfile(false);
    }
  }

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Landing Navbar */}
      <header className="bg-white border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <a href="#hero" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 group">
            <span className="text-2xl font-bold uppercase tracking-tight group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-transform">
              Stake<span className="bg-yellow border-2 border-black px-1">HUB</span>
            </span>
          </a>

          {/* Nav Links — smooth scroll */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Why StakeHub', href: '#why' },
              { label: 'Tech', href: '#tech' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={e => {
                  e.preventDefault();
                  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="font-bold uppercase text-sm hover:bg-yellow hover:px-2 transition-all border-b-2 border-transparent hover:border-black"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {!isConnected ? (
              <CustomConnectButton />
            ) : (
              <Link href="/arenas">
                <button className="px-5 py-2 bg-yellow border-3 border-black font-bold uppercase text-sm brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] transition-transform">
                  Enter Arena →
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Live Activity */}
      <section id="hero" className="border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Main Hero Content */}
            <div className="lg:col-span-2">
              <div className="mb-6 inline-block bg-yellow border-3 border-black px-4 py-2">
                <span className="font-bold uppercase text-sm">Built on Monad • Powered by Farcaster</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold uppercase mb-6 leading-tight tracking-tight">
                The Social Staking<br />
                Arena.
              </h1>

              <p className="text-xl md:text-2xl font-bold mb-6 leading-relaxed">
                The first Social Staking protocol built for the Monad speed-run.
              </p>

              <p className="text-lg md:text-xl mb-8 max-w-2xl leading-relaxed">
                Back your friends, stake on creator challenges, and build an on-chain reputation that actually matters. <span className="font-bold">No house, no limits</span>—just the Arena.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                {!isConnected ? (
                  <CustomConnectButton />
                ) : (
                  <Link href="/arenas">
                    <Button size="lg" variant="primary">ENTER THE ARENA</Button>
                  </Link>
                )}
                <Link href="/arenas">
                  <Button size="lg" variant="outline">VIEW LIVE CHALLENGES</Button>
                </Link>
              </div>

              {isCheckingProfile && (
                <div className="inline-block bg-yellow border-3 border-black px-6 py-3 animate-pulse">
                  <p className="font-bold">Setting up your profile...</p>
                </div>
              )}
            </div>

            {/* Live Activity Pulse */}
            <div className="lg:col-span-1">
              <Card className="bg-white sticky top-6">
                <CardHeader className="border-b-3 border-black bg-yellow">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-bold uppercase text-sm">LIVE ON-CHAIN</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-0 max-h-96 overflow-hidden">
                  {liveActivity.map((activity, i) => (
                    <div
                      key={i}
                      className="p-4 border-b-3 border-black hover:bg-yellow transition-colors"
                    >
                      <p className="text-sm mb-1 font-bold">
                        <span className="text-black">{activity.user}</span>
                      </p>
                      <p className="text-xs text-gray-700 mb-2">{activity.action}</p>
                      <p className="text-xs text-gray-600 mb-2 italic">"{activity.arena}"</p>
                      {activity.likelihood && (
                        <div className="inline-block bg-black text-yellow px-2 py-1 text-xs font-bold border-2 border-black">
                          {activity.likelihood} Likelihood
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="p-4 text-center bg-offwhite">
                    <p className="text-xs text-gray-600 uppercase font-bold">Powered by 400ms indexer</p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why StakeHub? - Technical Differentiation */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl md:text-5xl font-bold uppercase text-center mb-6">
          Why StakeHub?
        </h2>
        <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
          Built on bleeding-edge infrastructure. Designed for speed, social, and transparency.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="text-4xl mb-4">🏎</div>
              <h3 className="text-2xl font-bold uppercase mb-4">Ludicrous Speed</h3>
              <p className="text-base leading-relaxed mb-4">
                Powered by <span className="font-bold">Monad's Parallel EVM</span>. Experience real-time odds that update the instant a stake is placed.
              </p>
              <p className="text-sm font-bold text-gray-700">
                Transactions confirm in under 1 second. No more waiting for "pending".
              </p>
            </CardBody>
          </Card>

          <Card className="bg-yellow hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="text-4xl mb-4">🤳</div>
              <h3 className="text-2xl font-bold uppercase mb-4">Social-First Identity</h3>
              <p className="text-base leading-relaxed mb-4">
                Built on the <span className="font-bold">Farcaster social graph</span>. Your followers and "follows" are automatically integrated via Warpcast Mini App SDK.
              </p>
              <p className="text-sm font-bold text-gray-700">
                See exactly who in your network is backing each outcome.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-2xl font-bold uppercase mb-4">Portable Reputation</h3>
              <p className="text-base leading-relaxed mb-4">
                Every win builds your <span className="font-bold">"Alpha Score"</span>. Your performance is verifiable and lives in your Digital Backpack across Web3.
              </p>
              <p className="text-sm font-bold text-gray-700">
                Win challenges. Level up. Unlock exclusive high-stakes arenas.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* The Alpha Loop - How it Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">

        <h2 className="text-4xl md:text-5xl font-bold uppercase text-center mb-6">
          The Alpha Loop
        </h2>
        <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
          Four steps from conviction to claim. Simple, transparent, on-chain.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="w-16 h-16 bg-yellow border-4 border-black flex items-center justify-center text-3xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold uppercase mb-4">Join/Create</h3>
              <p className="text-base leading-relaxed">
                Use your Farcaster identity to enter a private or public Arena.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="w-16 h-16 bg-yellow border-4 border-black flex items-center justify-center text-3xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold uppercase mb-4">Stake</h3>
              <p className="text-base leading-relaxed">
                Back your conviction with native MON or $HUB tokens.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-yellow hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center text-3xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold uppercase mb-4">Watch</h3>
              <p className="text-base leading-relaxed">
                Experience real-time odds updates as the community reacts.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="w-16 h-16 bg-yellow border-4 border-black flex items-center justify-center text-3xl font-bold mb-6">
                4
              </div>
              <h3 className="text-xl font-bold uppercase mb-4">Claim</h3>
              <p className="text-base leading-relaxed">
                Winners "pull" their share of the pot and gain permanent Reputation XP.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* The Arena Module */}
      <section id="why" className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black bg-white">
        <h2 className="text-4xl md:text-5xl font-bold uppercase text-center mb-6">
          The "Arena" Explained
        </h2>
        <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
          No House. No Limits. Just pure parimutuel dynamics.
        </p>

        <div className="max-w-5xl mx-auto">
          <Card className="bg-yellow mb-12">
            <CardBody className="p-10">
              <h3 className="text-2xl font-bold uppercase mb-6 text-center">How It Works</h3>
              <p className="text-lg leading-relaxed mb-6">
                In the Arena, <span className="font-bold">creators set the challenge</span> and followers pool their stakes. Winnings are distributed proportionally from the losers' pool to the winners.
              </p>
              <div className="bg-black text-white p-6 border-4 border-black">
                <p className="font-mono text-sm mb-2">Payout Formula:</p>
                <p className="font-mono text-lg">P = a + (a/W × L) × (1 - fee)</p>
                <div className="mt-4 text-xs space-y-1">
                  <p>• P = Your total payout</p>
                  <p>• a = Your stake amount</p>
                  <p>• W = Total winning pool</p>
                  <p>• L = Total losing pool</p>
                  <p>• fee = 2% (or 1% with $HUB)</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white">
              <CardBody className="p-6">
                <h4 className="font-bold uppercase text-lg mb-3">Live Odds</h4>
                <p className="text-sm leading-relaxed">
                  Dynamic percentage based on real-time YES/NO pool ratio
                </p>
              </CardBody>
            </Card>
            <Card className="bg-white">
              <CardBody className="p-6">
                <h4 className="font-bold uppercase text-lg mb-3">Participant Count</h4>
                <p className="text-sm leading-relaxed">
                  See exactly how many stakers are in the game
                </p>
              </CardBody>
            </Card>
            <Card className="bg-white">
              <CardBody className="p-6">
                <h4 className="font-bold uppercase text-lg mb-3">Creator Profile</h4>
                <p className="text-sm leading-relaxed">
                  Linked Farcaster identity with reputation score
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Arena Visibility Modes */}
      <section id="tech" className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">

        <h2 className="text-4xl md:text-5xl font-bold uppercase text-center mb-6">
          Choose Who Gets In
        </h2>
        <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
          Control visibility. Public, followers-only, or invite-only — you decide the Arena rules.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8 text-center">
              <div className="w-20 h-20 bg-yellow border-4 border-black flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                P
              </div>
              <h3 className="text-xl font-bold uppercase mb-4">Public</h3>
              <p className="text-base leading-relaxed">
                Maximum visibility. Viral potential. Open to the entire Farcaster community.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-yellow hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8 text-center">
              <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                F
              </div>
              <h3 className="text-xl font-bold uppercase mb-4">Followers Only</h3>
              <p className="text-base leading-relaxed">
                Social graph gating. Build trust. Exclusive to your verified Farcaster followers.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8 text-center">
              <div className="w-20 h-20 bg-yellow border-4 border-black flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                I
              </div>
              <h3 className="text-xl font-bold uppercase mb-4">Invite Only</h3>
              <p className="text-base leading-relaxed">
                Ultimate privacy. High-stakes predictions. Private markets for your inner circle.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Tokenomics - $HUB */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">
        <h2 className="text-4xl md:text-5xl font-bold uppercase text-center mb-6">
          💎 $HUB Tokenomics
        </h2>
        <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
          Stake $HUB to reduce fees, unlock governance, and gain visibility boosts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-yellow">
            <CardBody className="p-8 text-center">
              <h4 className="font-bold text-2xl uppercase mb-4">Fee Discounts</h4>
              <p className="text-base leading-relaxed">
                Stake ≥1000 $HUB to reduce protocol fees from 2% to 1%
              </p>
            </CardBody>
          </Card>
          <Card className="bg-white">
            <CardBody className="p-8 text-center">
              <h4 className="font-bold text-2xl uppercase mb-4">Governance</h4>
              <p className="text-base leading-relaxed">
                Vote on market parameters and resolver dispute mechanisms
              </p>
            </CardBody>
          </Card>
          <Card className="bg-yellow">
            <CardBody className="p-8 text-center">
              <h4 className="font-bold text-2xl uppercase mb-4">The Burn</h4>
              <p className="text-base leading-relaxed">
                Deflationary pressure from 1% protocol fee split to $HUB buyback
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/hub">
            <Button size="lg" variant="primary">CLAIM FREE $HUB</Button>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-32 border-t-4 border-black text-center bg-white">
        <h2 className="text-4xl md:text-6xl font-bold uppercase mb-8 leading-tight">
          Ready to Enter<br />
          The Arena?
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          {!isConnected ? (
            <>
              <CustomConnectButton />
              <Link href="/arenas">
                <Button size="lg" variant="outline">EXPLORE ARENAS</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/create">
                <Button size="lg" variant="primary">LAUNCH YOUR ARENA</Button>
              </Link>
              <Link href="/arenas">
                <Button size="lg" variant="primary">OPEN IN WARPCAST</Button>
              </Link>
            </>
          )}
        </div>

        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          Built for the <span className="font-bold">Monad Blitz Hackathon</span>.
          Powered by Monad's Parallel EVM and Farcaster's social graph.
        </p>
      </section>

      {/* Footer with Trust Signals */}
      <footer className="bg-black text-white py-16 border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-6">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-3xl font-bold uppercase mb-4">STAKEHUB</h3>
              <p className="text-gray-400 text-lg mb-6">The Social Staking Arena</p>
              <p className="text-sm text-gray-500">
                Stake on outcomes. Build reputation. Win together.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg uppercase mb-4">Quick Links</h4>
              <div className="space-y-3">
                <Link href="/arenas" className="block text-gray-400 hover:text-yellow transition-colors">
                  Explore Arenas
                </Link>
                <Link href="/create" className="block text-gray-400 hover:text-yellow transition-colors">
                  Create Challenge
                </Link>
                <Link href="/hub" className="block text-gray-400 hover:text-yellow transition-colors">
                  Get $HUB
                </Link>
                <a href="https://github.com/yourusername/stakehub" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-yellow transition-colors">
                  GitHub
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg uppercase mb-4">Built On</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow"></div>
                  <span className="text-gray-400">Monad Testnet (0.4s blocks)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow"></div>
                  <span className="text-gray-400">Farcaster Social Graph</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow"></div>
                  <span className="text-gray-400">Prisma + PostgreSQL</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow"></div>
                  <span className="text-gray-400">UUPS Upgradeable Contracts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="border-t-2 border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="bg-gray-900 border-2 border-gray-700 px-4 py-2">
                  <span className="text-xs uppercase font-bold text-gray-400">Built on Monad</span>
                </div>
                <div className="bg-gray-900 border-2 border-gray-700 px-4 py-2">
                  <span className="text-xs uppercase font-bold text-gray-400">Powered by Farcaster</span>
                </div>
                <div className="bg-gray-900 border-2 border-gray-700 px-4 py-2">
                  <span className="text-xs uppercase font-bold text-gray-400">Pull-over-Push Security</span>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                © 2026 StakeHub. Built for Monad Blitz.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
