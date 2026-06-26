import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getSiteUrl } from '@jebdekho/web-config';
import { BRAND_LOGO_SRC, BRAND_NAME, BRAND_ICONS } from '@/lib/brand';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'JebDekho — Hyperlocal delivery',
    template: '%s | JebDekho',
  },
  description: 'Discover nearby stores and order fresh groceries delivered to your door.',
  manifest: '/manifest.json',
  icons: BRAND_ICONS,
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: BRAND_NAME,
    images: [{ url: BRAND_LOGO_SRC, width: 1254, height: 1254, alt: BRAND_NAME }],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JebDekho',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  sameAs: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={inter.variable}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
