import { NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import type { ApiResponse } from '@/types/auth';

/** The agreement text. Public — a merchant must be able to read it before signing up. */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  try {
    const { data } = await backendFetch<ApiResponse<unknown>>(`/legal/documents/${code}`);
    return NextResponse.json({ success: true, data: data.data });
  } catch (err) {
    const status = err instanceof BackendError ? err.status : 500;
    return NextResponse.json({ success: false, message: 'Could not load document' }, { status });
  }
}
