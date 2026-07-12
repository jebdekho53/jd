import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session';

/**
 * Streams a WhatsApp message's media (image/audio/video/document) from the API,
 * authenticated with the admin's access token. Binary passthrough — the normal
 * JSON BFF proxy can't carry bytes, so this route forwards the stream and its
 * Content-Type as-is. Used as the `src` for <img>/<audio>/<video>/download links.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const call = async (token: string) =>
    fetch(`${getApiBaseUrl()}/admin/whatsapp/messages/${encodeURIComponent(id)}/media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  let token = (await getAccessToken()) ?? (await refreshAccessToken());
  if (!token) return new Response('Not authenticated', { status: 401 });

  let upstream = await call(token);
  if (upstream.status === 401) {
    token = (await refreshAccessToken()) ?? '';
    if (!token) return new Response('Not authenticated', { status: 401 });
    upstream = await call(token);
  }

  if (!upstream.ok) {
    return new Response('Media unavailable', { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=86400',
      ...(upstream.headers.get('content-disposition')
        ? { 'Content-Disposition': upstream.headers.get('content-disposition') as string }
        : {}),
    },
  });
}
