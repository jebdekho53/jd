import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  return proxyGet(req, '/rider/kyc/documents');
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/rider/kyc/documents');
}
