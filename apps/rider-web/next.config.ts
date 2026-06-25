import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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

export default nextConfig;
