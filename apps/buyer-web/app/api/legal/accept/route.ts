import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth } from '@/lib/auth/session';

/**
 * Record that the signed-in user accepted a legal document version.
 * The API validates the version and captures the IP — the client cannot forge
 * either.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await fetchWithAuth('/legal/accept', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
