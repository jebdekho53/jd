import { NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    const data = await fetchWithAuth('/admin-auth/sessions');
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
