import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout.trim() || randomUUID();
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? revision.slice(0, 7);

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/offline', revision }],
});

const nextConfig: NextConfig = {
  // Building in place overwrites .next while the live server is serving from
  // it, which breaks chunk loading for anyone mid-session. Set JD_DIST_DIR to
  // verify a build without touching the running one.
  //
  // Caveat: Next rewrites tsconfig.json and next-env.d.ts to point at whatever
  // distDir is set, so `git checkout tsconfig.json next-env.d.ts` afterwards —
  // committing those would break the real deploy build's typecheck.
  ...(process.env.JD_DIST_DIR ? { distDir: process.env.JD_DIST_DIR } : {}),
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  transpilePackages: ['@jebdekho/web-config'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Client' },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
