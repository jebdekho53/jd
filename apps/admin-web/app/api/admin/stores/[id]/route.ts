import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

/** BFF: /api/admin/stores/:id → backend /admin/store-approvals/:id */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet(`/admin/store-approvals/${id}`);
}
