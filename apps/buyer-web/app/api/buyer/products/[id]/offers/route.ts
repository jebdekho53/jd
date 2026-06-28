import { proxyGet } from '@/lib/auth/bff-proxy';
import type { NextRequest } from 'next/server';

async function fetchOffers(req: NextRequest, productId: string) {
  const qs = req.nextUrl.searchParams.toString();
  const suffix = qs ? `?${qs}` : '';
  try {
    const { fetchWithAuth } = await import('@/lib/auth/session');
    const data = await fetchWithAuth<unknown>(`/buyer/products/${productId}/offers${suffix}`);
    return Response.json({ success: true, data });
  } catch {
    const { backendFetch } = await import('@/lib/auth/backend-fetch');
    const { data } = await backendFetch<{ success: boolean; data: unknown }>(
      `/buyer/products/${productId}/offers${suffix}`,
    );
    return Response.json(data);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return fetchOffers(req, id);
}
