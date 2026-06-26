import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getSiteUrl } from '@jebdekho/web-config';
import { BRAND_LOGO_SRC, BRAND_NAME, BRAND_TAGLINE, BRAND_ICONS } from '@/lib/brand';
import { PWA_THEME_COLOR, PWA_BACKGROUND_COLOR } from '@/lib/pwa/constants';
import { APPLE_SPLASH_LINKS } from '@/lib/pwa/apple-splash';
import { QueryProvider } from '@/components/providers/query-provider';
import { PwaProvider } from '@/components/pwa/pwa-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: BRAND_NAME,
  title: {
    default: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: BRAND_TAGLINE,
  manifest: '/manifest.webmanifest',
  icons: BRAND_ICONS,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRAND_NAME,
  },
  formatDetection: { telephone: false },
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: BRAND_NAME,
    images: [{ url: BRAND_LOGO_SRC, width: 1254, height: 1254, alt: BRAND_NAME }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': PWA_THEME_COLOR,
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JebDekho',
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  sameAs: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {APPLE_SPLASH_LINKS.map((s) => (
          <link key={s.href} rel="apple-touch-startup-image" media={s.media} href={s.href} />
        ))}
      </head>
      <body className={`${inter.variable} pwa-root`}>
        <QueryProvider>
          <PwaProvider>{children}</PwaProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
