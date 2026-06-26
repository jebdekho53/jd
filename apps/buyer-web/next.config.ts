import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout.trim() || randomUUID();

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
  transpilePackages: ['@jebdekho/order-timeline', '@jebdekho/web-config'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'https', hostname: 'api.jebdekho.com' },
    ],
  },
};

export default withSerwist(nextConfig);
