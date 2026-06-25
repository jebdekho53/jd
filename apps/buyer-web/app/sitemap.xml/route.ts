import { getApiOrigin } from '@/lib/seo/proxy';

export const dynamic = 'force-dynamic';

const FALLBACK = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`;

export async function GET() {
  try {
    const res = await fetch(`${getApiOrigin()}/sitemap.xml`, { cache: 'no-store' });
    if (!res.ok) return new Response(FALLBACK, { headers: { 'Content-Type': 'application/xml' } });
    return new Response(await res.text(), { headers: { 'Content-Type': 'application/xml' } });
  } catch {
    return new Response(FALLBACK, { headers: { 'Content-Type': 'application/xml' } });
  }
}
