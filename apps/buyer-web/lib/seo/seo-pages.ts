import { getApiBaseUrl } from '@jebdekho/web-config';
import { createPageMetadata } from '@/lib/seo/metadata';

export async function fetchSeoPage(path: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/public/seo/page?path=${encodeURIComponent(path)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as {
      page: { title: string; description: string; h1: string; faqs: Array<{ question: string; answer: string }> };
      schemas: Record<string, unknown>[];
      featuredAnswer?: { answer: string; snippet: string };
    } | null;
  } catch {
    return null;
  }
}

export function seoPageMetadata(page: { title: string; description: string }, path: string) {
  return createPageMetadata({ title: page.title, description: page.description, path });
}
