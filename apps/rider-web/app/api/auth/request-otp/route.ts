import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { errorResponse } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<{ success: boolean; data: { message: string; expiresIn: number } }>(
      '/auth/request-otp',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return Response.json({ success: true, data: data.data });
  } catch (err) {
    return errorResponse(err);
  }
}
