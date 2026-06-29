import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import { nextSecurityHeaders } from '@jebdekho/web-config';

const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout.trim() || randomUUID();

function resolveAppVersion(): string {
  if (process.env.NEXT_PUBLIC_APP_VERSION) return process.env.NEXT_PUBLIC_APP_VERSION;
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8')) as {
      version?: string;
    };
    if (pkg.version) return pkg.version;
  } catch {
    /* use git revision */
  }
  return revision.slice(0, 7);
}

const appVersion = resolveAppVersion();

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [
    { url: '/offline', revision },
    { url: '/checkout/razorpay-callback', revision },
    { url: '/pwa/icons/icon-192.png', revision },
    { url: '/pwa/icons/icon-512.png', revision },
  ],
  globPublicPatterns: ['pwa/**/*.{png,svg,ico,xml}'],
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  transpilePackages: ['@jebdekho/order-timeline', '@jebdekho/web-config'],
  async headers() {
    return nextSecurityHeaders();
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.jebdekho.com', pathname: '/uploads/**' },
      ...(process.env.NEXT_PUBLIC_UPLOAD_HOST
        ? [{ protocol: 'https' as const, hostname: process.env.NEXT_PUBLIC_UPLOAD_HOST, pathname: '/**' }]
        : []),
    ],
  },
};

export default withSerwist(nextConfig);
