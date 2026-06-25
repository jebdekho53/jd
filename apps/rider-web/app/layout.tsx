import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JebDekho Rider BFF',
  description: 'API gateway for the JebDekho rider mobile app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
