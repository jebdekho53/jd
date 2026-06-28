import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  let accessToken = await getAccessToken();
  if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined;
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const fetchCsv = async (token: string) => {
    const res = await fetch(`${getApiBaseUrl()}/merchant/stores/${storeId}/products/csv/template`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new BackendError(
        (body as { message?: string }).message ?? 'Failed to download template',
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
        'Content-Disposition': 'attachment; filename="product-import-template.csv"',
      },
    });
  } catch (err) {
    if (err instanceof BackendError && (err.status === 401 || err.status === 403)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const text = await fetchCsv(refreshed);
        return new Response(text, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="product-import-template.csv"',
          },
        });
      }
    }
    const message = err instanceof Error ? err.message : 'Download failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
