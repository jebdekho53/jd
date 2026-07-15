import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet(req, `/rider/support/tickets/${id}`);
}
