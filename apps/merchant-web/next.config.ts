import type { NextConfig } from 'next';
import { nextSecurityHeaders } from '@jebdekho/web-config';

const nextConfig: NextConfig = {
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

export default nextConfig;
