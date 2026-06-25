import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Jebdekho Vendor', template: '%s — Jebdekho Vendor' },
  description: 'B2B vendor portal for Jebdekho supply chain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
