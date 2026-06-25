import { getApiOrigin } from '@/lib/seo/proxy';

export const dynamic = 'force-dynamic';

const FALLBACK = '# JebDekho\n\n> Hyperlocal commerce marketplace\n';

export async function GET() {
  try {
    const res = await fetch(`${getApiOrigin()}/llms.txt`, { cache: 'no-store' });
    if (!res.ok) return new Response(FALLBACK, { headers: { 'Content-Type': 'text/plain' } });
    return new Response(await res.text(), { headers: { 'Content-Type': 'text/plain' } });
  } catch {
    return new Response(FALLBACK, { headers: { 'Content-Type': 'text/plain' } });
  }
}
