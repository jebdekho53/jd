import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function POST(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    const { analysisId } = await params;
    const body = await req.json();
    return NextResponse.json({ success: true, data: await fetchWithAuth(`/admin/ai-catalog/moderation/${analysisId}`, { method: 'POST', body: JSON.stringify(body) }) });
  } catch (err) {
    return errorResponse(err);
  }
}
