'use client';

import Link from 'next/link';

/** Kept in step with MERCHANT_AGREEMENT.version in the API's legal registry. */
export const MERCHANT_AGREEMENT_VERSION = 'v1';

/**
 * Consent tick gating merchant signup.
 *
 * The agreement opens in a new tab rather than a modal so a merchant can read it
 * alongside the form without losing what they have typed.
 */
export function MerchantAgreementAcceptance({
  checked,
  onChange,
  error,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="flex cursor-pointer select-none items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-xs leading-relaxed text-slate-600">
          I have read and accept the{' '}
          <Link
            href="/agreement"
            target="_blank"
            className="font-medium text-brand-600 hover:underline"
          >
            Merchant Partner Agreement
          </Link>{' '}
          — including the commission, settlement, return and delisting terms — and I am authorised to
          accept it for my business. The agreement is with UrbanMove Services Private Limited, which
          operates JebDekho.
        </span>
      </label>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Write the acceptance evidence once the account exists.
 *
 * Never throws: the merchant has ticked and the account is created, so failing
 * the signup over an evidence write would be worse than a missing row — the
 * API's pending check re-asks on next login.
 */
export async function recordMerchantAgreementAcceptance(): Promise<void> {
  try {
    await fetch('/api/legal/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'MERCHANT_AGREEMENT', version: MERCHANT_AGREEMENT_VERSION }),
    });
  } catch {
    // Swallowed by design — see above.
  }
}
