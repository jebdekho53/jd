import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET() {
  return proxyGet('/admin/delivery-coverage/overview');
}
