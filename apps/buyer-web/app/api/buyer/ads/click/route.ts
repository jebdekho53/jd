import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';

/**
 * Records a click on a sponsored placement. Public + fire-and-forget: buyers may
 * be anonymous, and a failed ad-click must never block navigation.
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    await fetch(`${getApiBaseUrl()}/buyer/ads/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body || '{}',
    });
  } catch {
    // Ignore — tracking is best-effort.
  }
  return NextResponse.json({ success: true });
}
