import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { errorResponse } from '@/lib/auth/session';
import type { ApiResponse } from '@/types/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<ApiResponse<{ message: string; expiresIn?: number; phone?: string }>>(
      '/auth/forgot-password',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return NextResponse.json({ success: true, data: data.data });
  } catch (err) {
    return errorResponse(err);
  }
}
