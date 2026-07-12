import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';

interface SponsoredProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  imageUrls: string[];
  storeId: string;
  sponsored: boolean;
  campaignId: string;
}

/** Public sponsored-products rail for the home page. Best-effort — empty on error. */
export async function GET() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/buyer/ads/sponsored`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ products: [] as SponsoredProduct[] });
    const body = (await res.json()) as { data?: { products?: SponsoredProduct[] } };
    return NextResponse.json({ products: body.data?.products ?? [] });
  } catch {
    return NextResponse.json({ products: [] as SponsoredProduct[] });
  }
}
