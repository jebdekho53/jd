import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Jebdekho Merchant', template: '%s — Jebdekho Merchant' },
  description: 'Merchant dashboard for Jebdekho hyperlocal commerce',
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
