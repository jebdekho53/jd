import { NextResponse } from 'next/server';
import { refreshAccessToken, errorResponse } from '@/lib/auth/session';

export async function POST() {
  try {
    const token = await refreshAccessToken();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Refresh failed' }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: { refreshed: true } });
  } catch (err) {
    return errorResponse(err);
  }
}
