import type { Metadata, Viewport } from 'next';
import { BRAND_ICONS } from '@/lib/brand';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'JebDekho Rider',
  description: 'Delivery partner app for JebDekho riders',
  icons: BRAND_ICONS,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'JebDekho Rider' },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
