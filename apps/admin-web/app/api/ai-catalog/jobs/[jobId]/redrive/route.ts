import { NextResponse } from 'next/server';
import { errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function POST(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    return NextResponse.json({ success: true, data: await fetchWithAuth(`/admin/ai-catalog/jobs/${jobId}/redrive`, { method: 'POST' }) });
  } catch (err) {
    return errorResponse(err);
  }
}
