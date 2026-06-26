import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pincode: string }> },
) {
  try {
    const { pincode } = await params;
    const { data } = await backendFetch<{ success: boolean; data: unknown }>(
      `/locations/pincodes/${pincode}`,
    );
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json({ success: false, message: 'Pincode lookup failed' }, { status: 404 });
  }
}
