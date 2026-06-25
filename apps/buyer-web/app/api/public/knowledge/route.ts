import { getApiBaseUrl } from '@jebdekho/web-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/public/knowledge`, { cache: 'no-store' });
    const json = await res.json();
    return Response.json(json);
  } catch {
    return Response.json({
      success: true,
      data: { platform: { name: 'JebDekho' }, cities: [], stores: [], categories: [], faqs: [] },
    });
  }
}
