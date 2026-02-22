'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { HUB_TOKEN_ADDRESS, HUB_TOKEN_ABI } from '@/lib/contracts';

export function Navbar() {
  const { address } = useAccount();

  // Read user's HUB balance
  const { data: hubBalance } = useReadContract({
    address: HUB_TOKEN_ADDRESS,
    abi: HUB_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Check if user has fee discount
  const { data: hasFeeDiscount } = useReadContract({
    address: HUB_TOKEN_ADDRESS,
    abi: HUB_TOKEN_ABI,
    functionName: 'hasFeeDiscount',
    args: address ? [address] : undefined,
  });

  const userHubBalance = hubBalance ? Number(formatEther(hubBalance as bigint)) : 0;

  return (
    <nav className="bg-white border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <span className="text-2xl font-bold uppercase tracking-tight group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-transform">
              Stake<span className="bg-yellow border-2 border-black px-1">HUB</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/arenas"
              className="font-bold uppercase text-sm hover:text-gray-600 transition-colors"
            >
              Arenas
            </Link>
            <Link
              href="/create"
              className="font-bold uppercase text-sm hover:text-gray-600 transition-colors"
            >
              Create Arena
            </Link>
            <Link
              href="/hub"
              className="font-bold uppercase text-sm hover:text-gray-600 transition-colors"
            >
              Get $HUB
            </Link>
            {address && (
              <Link
                href={`/profile/${address}`}
                className="font-bold uppercase text-sm hover:text-gray-600 transition-colors"
              >
                Profile
              </Link>
            )}
          </div>

          {/* Wallet Connect */}
          <div className="flex items-center space-x-4">
            {address && (
              <Link href="/hub">
                <div
                  className={`px-3 py-2 border-3 border-black font-bold text-sm cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] transition-transform ${hasFeeDiscount ? 'bg-lime' : 'bg-yellow'
                    }`}
                >
                  <span className="font-mono">{userHubBalance.toFixed(0)}</span> $HUB
                  {hasFeeDiscount && <span className="ml-2">✓</span>}
                </div>
              </Link>
            )}
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
