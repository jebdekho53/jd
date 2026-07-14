import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/session';

/** KYC document upload (PDF or image). Authenticated — partners only. */
export async function POST(req: NextRequest) {
  return proxyPost(req, '/uploads/document');
}
