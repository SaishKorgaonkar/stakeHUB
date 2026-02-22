import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from 'sonner';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
});

export const metadata: Metadata = {
  title: 'StakeHub - The Social Staking Arena',
  description: 'The first Social Staking protocol built for Monad. Stake on outcomes, build reputation, win together.',
  keywords: ['Monad', 'Farcaster', 'Social Staking', 'Prediction Markets', 'Parimutuel', 'DeFi', 'SocialFi'],
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    title: 'StakeHub - The Social Staking Arena',
    description: 'Built for the Monad speed-run. 0.4s blocks, social-first identity, portable reputation.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StakeHub - The Social Staking Arena',
    description: 'The first Social Staking protocol built for Monad. Stake. Watch. Win.',
    images: ['/og-image.png'],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
      button: {
        title: 'Enter the Arena',
        action: {
          type: 'launch_miniapp',
          url: process.env.NEXT_PUBLIC_APP_URL,
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#FFE500',
                color: '#000000',
                border: '3px solid #000000',
                boxShadow: '4px 4px 0px #000000',
                borderRadius: 0,
                fontFamily: 'var(--font-space-grotesk)',
                fontWeight: 600,
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
