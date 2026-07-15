import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/session';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPost(req, `/rider/support/tickets/${id}/reply`);
}
