'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Wait one tick before checking — avoids false redirect during SSR hydration
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    // Don't redirect while: not yet mounted, still connecting, or wagmi is silently
    // reconnecting to a previously connected wallet (common on page reload)
    if (mounted && !isConnecting && !isReconnecting && !isConnected) {
      router.push('/');
    }
  }, [mounted, isConnected, isConnecting, isReconnecting, router]);

  // Show loading while reconnecting or not yet mounted
  if (!mounted || isConnecting || isReconnecting) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <div className="bg-white border-4 border-black px-8 py-6 brutal-shadow">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 border-4 border-black border-t-yellow animate-spin rounded-full"></div>
            <p className="font-bold uppercase text-lg">Loading StakeHub...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if definitely not connected (after all checks pass)
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <div className="bg-white border-4 border-black px-8 py-6 brutal-shadow max-w-md text-center">
          <p className="font-bold uppercase text-xl mb-4">⚠️ Wallet Not Connected</p>
          <p className="text-gray-700 mb-6">
            Please connect your wallet to access StakeHub features.
          </p>
          <p className="text-sm text-gray-600">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
