import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';

export async function GET(req: NextRequest) {
  let accessToken = await getAccessToken();
  if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined;
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const qs = new URL(req.url).searchParams.toString();
  const path = `/admin/ai-product-usage/export${qs ? `?${qs}` : ''}`;

  const fetchCsv = async (token: string) => {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new BackendError(
        (body as { message?: string }).message ?? 'Export failed',
        res.status,
      );
    }
    return res.text();
  };

  try {
    const text = await fetchCsv(accessToken);
    return new Response(text, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ai-product-usage.csv"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
