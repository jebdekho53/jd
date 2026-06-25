import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@jebdekho/order-timeline', '@jebdekho/web-config'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'https', hostname: 'api.jebdekho.com' },
    ],
  },
};

export default nextConfig;
