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
      {/* Hero Section */}
      <section className="border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto px-6 py-32">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold uppercase mb-8 leading-tight tracking-tight">
              Prediction Markets,<br />
              Native to Farcaster.<br />
              Built on Monad.
            </h1>
            <p className="text-xl md:text-2xl font-bold mb-12 max-w-3xl mx-auto leading-relaxed">
              Stake MON on social outcomes. Real-time odds. 0.4s finality.<br />
              Public, followers-only, or invite-only markets. Fully inside Warpcast.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              {!isConnected ? (
                <>
                  <CustomConnectButton />
                  <Link href="/arenas">
                    <Button size="lg" variant="outline">VIEW DOCS</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/arenas">
                    <Button size="lg" variant="primary">LAUNCH MINI APP</Button>
                  </Link>
                  <Link href="/arenas">
                    <Button size="lg" variant="outline">VIEW DOCS</Button>
                  </Link>
                </>
              )}
            </div>

            {isCheckingProfile && (
              <div className="mt-8 inline-block bg-yellow border-3 border-black px-6 py-3">
                <p className="font-bold animate-pulse">Setting up your profile...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why StakeHub */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-5xl md:text-6xl font-bold uppercase text-center mb-16">
          Why StakeHub
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <h3 className="text-2xl font-bold uppercase mb-5">Real-Time On-Chain Experience</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>0.4s confirmation on Monad</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Odds update instantly</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Live animated pool bars</span>
                </li>
              </ul>
            </CardBody>
          </Card>

          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <h3 className="text-2xl font-bold uppercase mb-5">Farcaster Native</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Sign in with Farcaster (no passwords)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Social graph-aware feed</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>"People you follow staked here"</span>
                </li>
              </ul>
            </CardBody>
          </Card>

          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <h3 className="text-2xl font-bold uppercase mb-5">Pure Parimutuel Model</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>No oracle pricing</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Odds derived from real stakes</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Transparent payout math</span>
                </li>
              </ul>
            </CardBody>
          </Card>

          <Card className="bg-yellow hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <h3 className="text-2xl font-bold uppercase mb-5">Social Capital</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Back outcomes you believe in</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Win proportional rewards</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Build on-chain reputation</span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* What You Can Do */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">
        <h2 className="text-5xl md:text-6xl font-bold uppercase text-center mb-16">
          What You Can Do
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white">
            <CardBody className="p-8">
              <h3 className="text-xl font-bold uppercase mb-5">Launch Arenas</h3>
              <ul className="space-y-2 text-base leading-relaxed">
                <li>• Public, followers-only, or invite-only</li>
                <li>• Custom outcomes & deadlines</li>
                <li>• Social graph gating</li>
                <li>• IPFS metadata storage</li>
              </ul>
            </CardBody>
          </Card>

          <Card className="bg-white">
            <CardBody className="p-8">
              <h3 className="text-xl font-bold uppercase mb-5">Stake MON</h3>
              <ul className="space-y-2 text-base leading-relaxed">
                <li>• Choose your outcome</li>
                <li>• See live implied odds</li>
                <li>• Instant confirmation</li>
                <li>• Claim with one click</li>
              </ul>
            </CardBody>
          </Card>

          <Card className="bg-white">
            <CardBody className="p-8">
              <h3 className="text-xl font-bold uppercase mb-5">Build Reputation</h3>
              <ul className="space-y-2 text-base leading-relaxed">
                <li>• FID-linked identity</li>
                <li>• On-chain win history</li>
                <li>• Social credibility</li>
                <li>• Rank on leaderboards</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Arena Types - Major USP */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">
        <h2 className="text-5xl md:text-6xl font-bold uppercase text-center mb-6">
          Create Your Way
        </h2>
        <p className="text-xl text-center font-bold mb-16 max-w-3xl mx-auto">
          Control who can participate. Build markets for the world, your followers, or your inner circle.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="w-16 h-16 bg-yellow border-4 border-black flex items-center justify-center text-2xl font-bold mb-6">
                🌍
              </div>
              <h3 className="text-2xl font-bold uppercase mb-4">Public Arenas</h3>
              <p className="text-base mb-4 leading-relaxed">
                Open to the entire Farcaster community
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Maximum visibility</li>
                <li>• Viral potential</li>
                <li>• Broader liquidity pools</li>
                <li>• Community discovery</li>
              </ul>
            </CardBody>
          </Card>

          <Card className="bg-yellow hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center text-2xl font-bold mb-6">
                👥
              </div>
              <h3 className="text-2xl font-bold uppercase mb-4">Followers Only</h3>
              <p className="text-base mb-4 leading-relaxed">
                Exclusive to your verified followers
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Build engaged communities</li>
                <li>• Reward loyal followers</li>
                <li>• Social graph gating</li>
                <li>• Trust-based participation</li>
              </ul>
            </CardBody>
          </Card>

          <Card className="bg-white hover:brutal-shadow-hover transition-all">
            <CardBody className="p-8">
              <div className="w-16 h-16 bg-yellow border-4 border-black flex items-center justify-center text-2xl font-bold mb-6">
                🔐
              </div>
              <h3 className="text-2xl font-bold uppercase mb-4">Invite Only</h3>
              <p className="text-base mb-4 leading-relaxed">
                Private markets for your inner circle
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Friends & close contacts</li>
                <li>• Custom invite lists</li>
                <li>• Ultimate privacy</li>
                <li>• High-stakes predictions</li>
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-black text-white max-w-3xl mx-auto">
            <CardBody className="p-8">
              <p className="text-lg font-bold leading-relaxed">
                Every arena. Three visibility modes. Your prediction markets, your rules.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Product Features */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">
        <h2 className="text-5xl md:text-6xl font-bold uppercase text-center mb-16">
          Product Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'On-Chain State Machine',
              desc: 'OPEN → LOCKED → RESOLVED. Fully enforced in smart contracts',
            },
            {
              title: 'Optimistic UI',
              desc: 'Transaction updates before block finality for instant feedback',
            },
            {
              title: 'Real-Time Feed',
              desc: 'Server-Sent Events for live pool updates without polling',
            },
            {
              title: 'Push Notifications',
              desc: 'Arena resolved • Claim available • Expiring soon',
            },
            {
              title: 'Social Ranking Engine',
              desc: 'Feed ranked by: Who you follow, stake velocity, pool size',
            },
            {
              title: 'Secure by Design',
              desc: 'Pull-based claims • Emergency cancel • Upgradeable contracts',
            },
          ].map((feature, i) => (
            <Card key={i} className="bg-white">
              <CardBody className="p-6">
                <h4 className="text-lg font-bold uppercase mb-4">{feature.title}</h4>
                <p className="text-sm leading-relaxed">{feature.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">
        <h2 className="text-5xl md:text-6xl font-bold uppercase text-center mb-16">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {[
            { num: '1', title: 'Create Arena', desc: 'Set outcomes and deadline', bg: 'bg-black text-white' },
            { num: '2', title: 'Followers Stake', desc: 'Community backs outcomes', bg: 'bg-black text-white' },
            { num: '3', title: 'Arena Locks', desc: 'Automatic at deadline', bg: 'bg-black text-white' },
            { num: '4', title: 'Winners Claim', desc: 'Proportional rewards', bg: 'bg-yellow text-black' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className={`w-20 h-20 ${step.bg} border-4 border-black flex items-center justify-center text-4xl font-bold mx-auto mb-6`}>
                {step.num}
              </div>
              <h4 className="font-bold text-xl mb-3 uppercase">{step.title}</h4>
              <p className="text-base text-gray-700">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white">
            <CardBody className="p-10 text-center">
              <div className="text-4xl font-bold mb-2">0.4s</div>
              <p className="font-bold uppercase">Block Finality</p>
            </CardBody>
          </Card>
          <Card className="bg-yellow">
            <CardBody className="p-10 text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <p className="font-bold uppercase">On-Chain</p>
            </CardBody>
          </Card>
          <Card className="bg-white">
            <CardBody className="p-10 text-center">
              <div className="text-4xl font-bold mb-2">3 Modes</div>
              <p className="font-bold uppercase">Visibility Options</p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* HUB Token Utility */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t-4 border-black">
        <h2 className="text-5xl md:text-6xl font-bold uppercase text-center mb-16">
          $HUB Token Utility
        </h2>
        
        <Card className="bg-yellow max-w-5xl mx-auto">
          <CardBody className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="font-bold text-2xl uppercase mb-6">Benefits</h4>
                <ul className="space-y-3 text-lg">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Reduced protocol fees (1% vs 2%)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Governance rights (future)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Reputation multiplier</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Creator boosts</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-2xl uppercase mb-6">How to Get</h4>
                <ul className="space-y-3 text-lg mb-8">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Claim 100 HUB every 24hrs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Swap MON → HUB</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Earn through activity</span>
                  </li>
                </ul>
                <Link href="/hub">
                  <Button variant="secondary" size="lg">GET $HUB</Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-32 border-t-4 border-black text-center">
        <h2 className="text-5xl md:text-7xl font-bold uppercase mb-14 leading-tight">
          Turn Predictions<br />Into Social Capital.
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {!isConnected ? (
            <CustomConnectButton />
          ) : (
            <>
              <Link href="/create">
                <Button size="lg" variant="primary">LAUNCH ARENA</Button>
              </Link>
              <Link href="/arenas">
                <Button size="lg" variant="primary">OPEN IN WARPCAST</Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-3xl font-bold uppercase mb-2">STAKEHUB</h3>
              <p className="text-gray-400 text-lg">Prediction Markets for Farcaster</p>
            </div>
            
            <div className="flex gap-8">
              <Link href="/arenas" className="font-bold text-lg hover:text-yellow transition-colors uppercase">
                Arenas
              </Link>
              <Link href="/hub" className="font-bold text-lg hover:text-yellow transition-colors uppercase">
                Get HUB
              </Link>
              <Link href="/create" className="font-bold text-lg hover:text-yellow transition-colors uppercase">
                Create
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
