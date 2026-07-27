import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    let accessToken = await getAccessToken();
    if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const res = await fetch(`${getApiBaseUrl()}/merchant/gst/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new BackendError((body as { message?: string }).message ?? 'Invoice download failed', res.status);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') ?? `attachment; filename="invoice-${id}.pdf"`;
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
    return NextResponse.json({ success: false, message: 'Invoice download failed' }, { status: 500 });
  }
}
