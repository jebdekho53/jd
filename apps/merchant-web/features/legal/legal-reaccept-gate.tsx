'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface PendingDocument {
  code: string;
  title: string;
  version: string;
  summary: string;
  isReacceptance: boolean;
}

/**
 * Proactive prompt: when the API reports the merchant owes acceptance of a
 * legal document (never accepted, or accepted an older version after a bump),
 * this blocks the dashboard with an accept modal.
 *
 * Fail-OPEN by design. The real enforcement is server-side: guarded transaction
 * endpoints reject with a 403 `LEGAL_ACCEPTANCE_REQUIRED` until acceptance is on
 * record. So this component only ever blocks on a *definitive* pending list —
 * loading, a network error, a 401, or a malformed response all fall through to
 * the app, and the backend remains the backstop. A blip can never lock a
 * merchant out of a live business.
 */
export function LegalReacceptGate({
  portal = 'merchant',
  agreementHref = '/agreement',
  children,
}: {
  portal?: string;
  agreementHref?: string;
  children: React.ReactNode;
}) {
  const [docs, setDocs] = useState<PendingDocument[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/legal/pending?portal=${encodeURIComponent(portal)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setDocs(null);
        return;
      }
      const json = await res.json();
      setDocs(Array.isArray(json?.data) ? json.data : null);
    } catch {
      setDocs(null);
    }
  }, [portal]);

  useEffect(() => {
    void load();
  }, [load]);

  // Fail-open: only a definitive, non-empty pending list blocks.
  if (!docs || docs.length === 0) return <>{children}</>;

  const allChecked = docs.every((doc) => checked[doc.code]);
  const reacceptance = docs.some((doc) => doc.isReacceptance);

  const onAccept = async () => {
    setSubmitting(true);
    setError(null);
    try {
      for (const doc of docs) {
        const res = await fetch('/api/legal/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: doc.code, version: doc.version }),
        });
        if (!res.ok) throw new Error('accept failed');
      }
      setChecked({});
      await load();
    } catch {
      setError('We could not record your acceptance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-reaccept-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 id="legal-reaccept-title" className="text-base font-semibold text-slate-900">
            {reacceptance ? 'Updated agreement — please review' : 'One more step'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {reacceptance
              ? 'We have updated the terms that govern your partnership. Please review and accept the latest version to continue.'
              : 'Please review and accept the following to continue using your dashboard.'}
          </p>
        </div>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto px-6 py-4">
          {docs.map((doc) => (
            <label
              key={doc.code}
              className="flex cursor-pointer select-none items-start gap-2.5 rounded-lg border border-slate-200 p-3"
            >
              <input
                type="checkbox"
                checked={Boolean(checked[doc.code])}
                disabled={submitting}
                onChange={(e) => setChecked((prev) => ({ ...prev, [doc.code]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs leading-relaxed text-slate-600">
                I have read and accept the{' '}
                <Link
                  href={agreementHref}
                  target="_blank"
                  className="font-medium text-brand-600 hover:underline"
                >
                  {doc.title}
                </Link>{' '}
                (version {doc.version}). {doc.summary}
              </span>
            </label>
          ))}
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <button
            type="button"
            disabled={!allChecked || submitting}
            onClick={onAccept}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Recording…' : 'Accept and continue'}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            The agreement is with UrbanMove Services Private Limited, which operates JebDekho.
          </p>
        </div>
      </div>
    </div>
  );
}
