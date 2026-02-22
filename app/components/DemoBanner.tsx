'use client';

import { useState } from 'react';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow border-b-4 border-black text-black">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <p className="font-bold text-sm uppercase">
                Demo Mode Active
              </p>
              <p className="text-xs">
                Connect MetaMask to get free test MON • All transactions simulated on Monad Testnet
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-black hover:text-gray-700 font-bold text-xl px-2"
            aria-label="Close banner"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
