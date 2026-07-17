'use client';

import Link from 'next/link';

/** Kept in step with BUYER_TERMS.version in the API's legal registry. */
export const BUYER_TERMS_VERSION = 'v1';

/**
 * Consent tick shown before an account is created.
 *
 * The acceptance itself can only be recorded once the account exists, so the tick
 * gates the submit and {@link recordTermsAcceptance} writes the evidence straight
 * after signup succeeds.
 */
export function TermsAcceptance({
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
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-jd-primary focus:ring-jd-primary"
        />
        <span className="text-xs leading-relaxed text-jd-text-muted">
          I agree to the{' '}
          <Link
            href="/terms"
            target="_blank"
            className="font-medium text-jd-primary hover:underline"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            target="_blank"
            className="font-medium text-jd-primary hover:underline"
          >
            Privacy Policy
          </Link>{' '}
          of JebDekho, operated by UrbanMove Services Private Limited.
        </span>
      </label>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Write the acceptance evidence. Called after the account exists and the session
 * is live.
 *
 * Deliberately never throws: the user has ticked and signed up, and failing the
 * signup because the evidence write failed would be a worse outcome than a
 * missing row we can re-ask for on next login (the API's `pending` check will
 * surface it again).
 */
export async function recordTermsAcceptance(): Promise<void> {
  try {
    await fetch('/api/legal/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'BUYER_TERMS', version: BUYER_TERMS_VERSION }),
    });
  } catch {
    // Swallowed by design — see above.
  }
}
