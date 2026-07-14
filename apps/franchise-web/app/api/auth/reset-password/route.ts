import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';

/**
 * Step 2 of "set a password": phone + OTP + newPassword.
 *
 * This is how a partner whose account already existed (they were a buyer before
 * taking the franchise) gets a password at all. Approval deliberately refuses to
 * copy the password chosen on the public application form onto a pre-existing
 * account — anyone can type someone else's phone number into a public form, so
 * doing that would hand them the account. Verifying an OTP proves they own the
 * number, which makes setting the password safe.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    await backendFetch('/auth/reset-password', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
    return NextResponse.json({ success: true, message: 'Password set. You can now sign in.' });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
