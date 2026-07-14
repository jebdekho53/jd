import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await fetchWithAuth('/admin/ai-catalog/config') });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await fetchWithAuth('/admin/ai-catalog/config', { method: 'POST', body: JSON.stringify(body) });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
