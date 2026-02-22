'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import sdk from '@farcaster/miniapp-sdk';

interface FarcasterUser {
  fid: number;
  username: string;
  pfpUrl: string;
  displayName?: string;
}

interface FarcasterContext {
  isSDK: boolean;
  isReady: boolean;
  context: any;
  user: FarcasterUser | null;
  sdk: typeof sdk;
}

const FarcasterCtx = createContext<FarcasterContext>({
  isSDK: false,
  isReady: false,
  context: null,
  user: null,
  sdk,
});

export function useFarcaster() {
  return useContext(FarcasterCtx);
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDK, setIsSDK] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [user, setUser] = useState<FarcasterUser | null>(null);

  useEffect(() => {
    async function initFarcaster() {
      try {
        // Get the Mini App context (only available inside Warpcast)
        const ctx = await sdk.context;

        if (ctx?.user?.fid) {
          setIsSDK(true);
          setContext(ctx);
          setUser({
            fid: ctx.user.fid,
            username: ctx.user.username || `fid:${ctx.user.fid}`,
            pfpUrl: ctx.user.pfpUrl || '',
            displayName: ctx.user.displayName,
          });
          console.log('✅ Farcaster Mini App context loaded', { fid: ctx.user.fid });
        }
      } catch (e) {
        // Not in Warpcast — running as standalone web app
        console.log('ℹ️ Not in Farcaster context, running as standalone app');
      } finally {
        // Always call ready() to dismiss the splash screen in Warpcast
        try {
          await sdk.actions.ready();
          setIsReady(true);
          console.log('✅ sdk.actions.ready() called');
        } catch (e) {
          // Not in Warpcast, this is a no-op
          setIsReady(true);
        }
      }
    }

    initFarcaster();
  }, []);

  return (
    <FarcasterCtx.Provider value={{ isSDK, isReady, context, user, sdk }}>
      {children}
    </FarcasterCtx.Provider>
  );
}
