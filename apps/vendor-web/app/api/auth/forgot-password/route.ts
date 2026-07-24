import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';

/**
 * Step 1 of "set a password": send a PASSWORD_RESET OTP to the vendor's phone.
 *
 * Public by design — the applicant has no session yet. Deliberately always reports
 * success so this cannot be used to probe which numbers are registered.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    await backendFetch('/auth/forgot-password', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (!(err instanceof BackendError)) {
      return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
    // Swallow 4xx: revealing "no such user" would leak who our vendors are.
  }
  return NextResponse.json({
    success: true,
    message: 'If that number belongs to a vendor, an OTP has been sent.',
  });
}
