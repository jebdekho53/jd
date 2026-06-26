import type { Metadata } from 'next';
import { BRAND_ICONS } from '@/lib/brand';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Jebdekho Merchant', template: '%s — Jebdekho Merchant' },
  description: 'Merchant dashboard for Jebdekho hyperlocal commerce',
  icons: BRAND_ICONS,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
