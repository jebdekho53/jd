import type { NextConfig } from 'next';
import { nextSecurityHeaders, uploadImageRemotePatterns } from '@jebdekho/web-config';

const nextConfig: NextConfig = {
  transpilePackages: ['@jebdekho/order-timeline', '@jebdekho/web-config', '@jebdekho/realtime'],
  async headers() {
    return nextSecurityHeaders();
  },
  images: {
    remotePatterns: uploadImageRemotePatterns(),
  },
};

export default nextConfig;
