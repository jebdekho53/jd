import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';

export async function GET(req: NextRequest) {
  try {
    let accessToken = await getAccessToken();
    if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const qs = req.nextUrl.searchParams.toString();
    const path = `${getApiBaseUrl()}/admin/analytics/export${qs ? `?${qs}` : ''}`;
    const res = await fetch(path, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new BackendError((body as { message?: string }).message ?? 'Export failed', res.status);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') ?? 'attachment; filename="analytics-export.csv"';
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'text/csv',
        'Content-Disposition': disposition,
      },
    });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Export failed' }, { status: 500 });
  }
}
