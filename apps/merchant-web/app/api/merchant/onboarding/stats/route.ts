import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';

export async function GET() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/merchant/onboarding/stats`, {
      next: { revalidate: 300 },
    });
    const body = await res.json();
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        activeCustomers: 10000,
        ordersDelivered: 50000,
        citiesServed: 5,
        merchantPartners: 500,
      },
    });
  }
}
