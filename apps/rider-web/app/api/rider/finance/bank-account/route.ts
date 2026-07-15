import { NextRequest } from 'next/server';
import { proxyGet, proxyPut } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  return proxyGet(req, '/rider/finance/bank-account');
}

export async function PUT(req: NextRequest) {
  return proxyPut(req, '/rider/finance/bank-account');
}
