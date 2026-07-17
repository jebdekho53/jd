'use client';

import Link from 'next/link';

/** Kept in step with RIDER_AGREEMENT.version in the API's legal registry. */
export const RIDER_AGREEMENT_VERSION = 'v1';

/**
 * Consent tick gating the rider application.
 *
 * The independent-contractor status is spelled out here rather than left to the
 * link: it is the single term most likely to be disputed later, so a rider
 * should not be able to say it was buried.
 */
export function RiderAgreementAcceptance({
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
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
        />
        <span className="text-xs leading-relaxed text-slate-400">
          I have read and accept the{' '}
          <Link href="/agreement" target="_blank" className="font-medium text-cyan-300 hover:underline">
            Delivery Partner Agreement
          </Link>
          . I understand I am an{' '}
          <span className="font-medium text-slate-200">independent contractor, not an employee</span>
          , that I choose when to work, and that I may work for other platforms. The agreement is with
          UrbanMove Services Private Limited, which operates JebDekho.
        </span>
      </label>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Write the acceptance evidence. The rider is already signed in when they apply,
 * so this records against their existing account.
 *
 * Never throws: the application has been submitted, and failing it over an
 * evidence write would be worse than a missing row the API re-asks for.
 */
export async function recordRiderAgreementAcceptance(): Promise<void> {
  try {
    await fetch('/api/legal/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'RIDER_AGREEMENT', version: RIDER_AGREEMENT_VERSION }),
    });
  } catch {
    // Swallowed by design — see above.
  }
}
