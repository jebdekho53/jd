import type { NextConfig } from 'next';
import { nextSecurityHeaders } from '@jebdekho/web-config';

const nextConfig: NextConfig = {
  transpilePackages: ['@jebdekho/web-config'],
  async headers() {
    return nextSecurityHeaders();
  },
};

export default nextConfig;
