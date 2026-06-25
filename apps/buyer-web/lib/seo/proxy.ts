import { getApiOrigin } from '@jebdekho/web-config';

export { getApiOrigin };

export async function proxySeoAsset(path: string): Promise<Response> {
  try {
    const res = await fetch(`${getApiOrigin()}${path}`, { cache: 'no-store' });
    return res;
  } catch {
    return new Response(null, { status: 502 });
  }
}
