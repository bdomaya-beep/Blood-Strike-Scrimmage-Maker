import type { Metadata } from 'next';
import { Orbitron, Rajdhani } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Blood Strike Scrim Hub',
    template: '%s | Blood Strike Scrim Hub',
  },
  description: 'The premier competitive platform for Blood Strike esports — scrimmages, tournaments, standings, and clan management.',
  keywords: ['blood strike', 'esports', 'scrimmage', 'tournament', 'competitive', 'fps'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bloodstrikehub.gg',
    siteName: 'Blood Strike Scrim Hub',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${orbitron.variable} ${rajdhani.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-900 font-rajdhani text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
