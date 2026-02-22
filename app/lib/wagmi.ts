'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monadTestnet } from './chains';

export const config = getDefaultConfig({
  appName: 'StakeHub',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [monadTestnet],
  ssr: true,
});
