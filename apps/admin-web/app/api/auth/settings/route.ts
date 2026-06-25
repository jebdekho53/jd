import { NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    const data = await fetchWithAuth('/admin-auth/settings');
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const data = await fetchWithAuth('/admin-auth/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
