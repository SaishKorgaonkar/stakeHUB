'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface FarcasterContext {
  isSDK: boolean;
  context: any;
  user: {
    fid: number;
    username: string;
    pfpUrl: string;
  } | null;
}

const FarcasterContext = createContext<FarcasterContext>({
  isSDK: false,
  context: null,
  user: null,
});

export function useFarcaster() {
  return useContext(FarcasterContext);
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDK, setIsSDK] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [user, setUser] = useState<FarcasterContext['user']>(null);

  useEffect(() => {
    // Check if running in Farcaster context via URL params
    // In production, integrate with Farcaster Frame SDK when available
    const params = new URLSearchParams(window.location.search);
    const fid = params.get('fid');
    
    if (fid) {
      setIsSDK(true);
      setUser({
        fid: parseInt(fid),
        username: params.get('username') || `fid:${fid}`,
        pfpUrl: params.get('pfp') || '',
      });
      console.log('✅ Farcaster context detected', { fid });
    }
  }, []);

  return (
    <FarcasterContext.Provider value={{ isSDK, context, user }}>
      {children}
    </FarcasterContext.Provider>
  );
}
