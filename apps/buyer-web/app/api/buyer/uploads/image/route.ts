import { proxyPost } from '@/lib/auth/bff-proxy';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return proxyPost(req, '/uploads/image');
}
