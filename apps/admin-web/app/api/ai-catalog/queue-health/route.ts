import { NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await fetchWithAuth('/admin/ai-catalog/queue-health') });
  } catch (err) {
    return errorResponse(err);
  }
}
