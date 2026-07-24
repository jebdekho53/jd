import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';

/**
 * Public vendor application. Deliberately does NOT go through the authenticated
 * proxy — an applicant has no account yet. Rate limiting is enforced by the API.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const { data } = await backendFetch<{ success: boolean; message?: string }>(
      '/vendor-applications/apply',
      { method: 'POST', body, headers: { 'Content-Type': 'application/json' } },
    );
    return NextResponse.json({ success: true, message: data?.message });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
