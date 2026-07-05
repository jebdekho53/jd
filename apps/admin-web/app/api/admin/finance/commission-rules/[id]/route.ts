import { NextRequest } from 'next/server';
import { proxyPatch, proxyDelete } from '@/lib/auth/bff-proxy';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPatch(req, `/admin/finance/commission-rules/${id}`);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyDelete(`/admin/finance/commission-rules/${id}`);
}
