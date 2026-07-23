import type { Metadata, Viewport } from 'next';
import { BRAND_ICONS } from '@/lib/brand';
import { riderSiteUrl } from '@/lib/public-routes';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(riderSiteUrl()),
  title: 'JebDekho Rider',
  description: 'Delivery partner app for JebDekho riders',
  icons: BRAND_ICONS,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'JebDekho Rider' },
  // Default to noindex: almost every route here is behind an OTP session. The
  // public pages opt back in individually. robots.txt disallow alone would not
  // stop an externally-linked /cod or /account URL from being indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-rider-bg text-rider-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
