import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Jebdekho Franchise', template: '%s — Jebdekho Franchise' },
  description: 'B2B franchise portal for Jebdekho supply chain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
