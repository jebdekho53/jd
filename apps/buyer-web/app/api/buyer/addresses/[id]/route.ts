import { NextRequest } from 'next/server';
import { proxyDelete, proxyPatch } from '@/lib/auth/bff-proxy';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPatch(req, `/buyer/addresses/${id}`);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyDelete(`/buyer/addresses/${id}`);
}
