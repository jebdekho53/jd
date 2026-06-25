import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';

export async function GET() {
  try {
    const { data } = await backendFetch<{ success: boolean; data: unknown }>('/geo/cities');
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to load cities' }, { status: 500 });
  }
}
