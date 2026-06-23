import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = (body as { reason?: string }).reason ?? 'Rider declined assignment';
    const data = await fetchWithAuth(
      `/rider/orders/${id}/failed`,
      { method: 'PATCH', body: JSON.stringify({ reason }) },
      req,
    );
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
