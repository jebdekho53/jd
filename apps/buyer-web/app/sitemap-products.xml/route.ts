import { getApiOrigin } from '@/lib/seo/proxy';

export const dynamic = 'force-dynamic';

const EMPTY = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

async function proxy(path: string) {
  try {
    const res = await fetch(`${getApiOrigin()}${path}`, { cache: 'no-store' });
    if (!res.ok) return new Response(EMPTY, { headers: { 'Content-Type': 'application/xml' } });
    return new Response(await res.text(), { headers: { 'Content-Type': 'application/xml' } });
  } catch {
    return new Response(EMPTY, { headers: { 'Content-Type': 'application/xml' } });
  }
}

export async function GET() {
  return proxy('/sitemap-products.xml');
}
