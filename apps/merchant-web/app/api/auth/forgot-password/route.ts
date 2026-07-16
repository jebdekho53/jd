import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';

/**
 * Request a password-reset link for a merchant account.
 * `portal: 'merchant'` makes the API email a link back to merchant.jebdekho.com
 * (without it the link would point at the buyer site).
 *
 * Always reports success so this can't be used to probe which emails are merchants.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await backendFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ ...body, portal: 'merchant' }),
    });
  } catch (err) {
    if (!(err instanceof BackendError)) {
      return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
    // Swallow 4xx — never reveal whether an account exists.
  }
  return NextResponse.json({
    success: true,
    data: { message: 'If an account exists, a reset link has been sent to your email.' },
  });
}
