import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[rider-gps-health]', JSON.stringify(body));
    return NextResponse.json({ success: true, data: { recorded: true } });
  } catch (err) {
    return errorResponse(err);
  }
}
