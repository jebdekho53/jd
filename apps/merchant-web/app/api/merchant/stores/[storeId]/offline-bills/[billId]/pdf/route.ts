import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ storeId: string; billId: string }> }) {
  const { storeId, billId } = await ctx.params;
  try {
    let accessToken = await getAccessToken();
    if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const res = await fetch(`${getApiBaseUrl()}/merchant/stores/${storeId}/offline-bills/${billId}/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new BackendError((body as { message?: string }).message ?? 'Bill download failed', res.status);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') ?? `attachment; filename="bill-${billId}.pdf"`;
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'application/pdf',
        'Content-Disposition': disposition,
      },
    });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Bill download failed' }, { status: 500 });
  }
}
