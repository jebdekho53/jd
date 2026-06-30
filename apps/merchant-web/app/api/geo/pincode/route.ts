import { NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode') ?? '';

  try {
    const { data } = await backendFetch<{ success: boolean; data: unknown }>(
      `/geo/geocode/pincode?pincode=${encodeURIComponent(pincode)}`,
    );
    return NextResponse.json({ success: true, data: data.data ?? null });
  } catch (err) {
    const status = err instanceof BackendError ? err.status : 500;
    const message = err instanceof BackendError ? err.message : 'Pincode lookup failed';
    return NextResponse.json({ success: false, message }, { status });
  }
}
