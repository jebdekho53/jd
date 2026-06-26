import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const limit = req.nextUrl.searchParams.get('limit') ?? '15';
    const { data } = await backendFetch<{ success: boolean; data: unknown }>(
      `/locations/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    );
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json({ success: false, message: 'Location search failed' }, { status: 500 });
  }
}
