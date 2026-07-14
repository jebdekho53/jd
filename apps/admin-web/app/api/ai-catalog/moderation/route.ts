import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const qs = new URL(req.url).searchParams.toString();
    return NextResponse.json({ success: true, data: await fetchWithAuth(`/admin/ai-catalog/moderation${qs ? `?${qs}` : ''}`) });
  } catch (err) {
    return errorResponse(err);
  }
}
