import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';

export async function GET() {
  try {
    let accessToken = await getAccessToken();
    if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const res = await fetch(`${getApiBaseUrl()}/admin/locations/export`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new BackendError((body as { message?: string }).message ?? 'Export failed', res.status);
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'text/csv',
        'Content-Disposition':
          res.headers.get('content-disposition') ?? 'attachment; filename="master-locations.csv"',
      },
    });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Export failed' }, { status: 500 });
  }
}
