import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cityId: string }> },
) {
  try {
    const { cityId } = await params;
    const { data } = await backendFetch<{ success: boolean; data: unknown }>(
      `/geo/cities/${cityId}/zones`,
    );
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to load zones' }, { status: 500 });
  }
}
