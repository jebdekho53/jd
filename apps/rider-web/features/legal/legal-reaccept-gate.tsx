'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface PendingDocument {
  code: string;
  title: string;
  version: string;
  summary: string;
  isReacceptance: boolean;
}

/**
 * Routes where the gate must stay inert: the delivery partner has to be able to
 * read the agreement, log in, and onboard without being prompted. The root
 * redirector ('/') is transient. Everything else is authenticated app.
 */
const EXCLUDED_PREFIXES = ['/login', '/agreement', '/onboarding'];

/**
 * Proactive prompt: when the API reports the rider owes acceptance of a legal
 * document, this blocks the app with an accept modal.
 *
 * Fail-OPEN by design. The real enforcement is server-side: guarded transaction
 * endpoints (accept assignment / picked-up / delivered) reject with a 403
 * `LEGAL_ACCEPTANCE_REQUIRED` until acceptance is on record. So this only blocks
 * on a *definitive* pending list — an excluded route, loading, a network error,
 * a 401, or a malformed response all fall through to the app.
 */
export function LegalReacceptGate({
  portal = 'rider',
  agreementHref = '/agreement',
  children,
}: {
  portal?: string;
  agreementHref?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const excluded =
    pathname === '/' ||
    EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const [docs, setDocs] = useState<PendingDocument[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (excluded) {
      setDocs(null);
      return;
    }
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
  }, [excluded, portal]);

  useEffect(() => {
    void load();
  }, [load]);

  if (excluded || !docs || docs.length === 0) return <>{children}</>;

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="border-b border-slate-700 px-6 py-4">
          <h2 id="legal-reaccept-title" className="text-base font-semibold text-slate-100">
            {reacceptance ? 'Updated agreement — please review' : 'One more step'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {reacceptance
              ? 'We have updated the terms for delivery partners. Please review and accept the latest version to continue.'
              : 'Please review and accept the following to continue.'}
          </p>
        </div>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto px-6 py-4">
          {docs.map((doc) => (
            <label
              key={doc.code}
              className="flex cursor-pointer select-none items-start gap-2.5 rounded-lg border border-slate-700 p-3"
            >
              <input
                type="checkbox"
                checked={Boolean(checked[doc.code])}
                disabled={submitting}
                onChange={(e) => setChecked((prev) => ({ ...prev, [doc.code]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-400"
              />
              <span className="text-xs leading-relaxed text-slate-300">
                I have read and accept the{' '}
                <Link
                  href={agreementHref}
                  target="_blank"
                  className="font-medium text-cyan-400 hover:underline"
                >
                  {doc.title}
                </Link>{' '}
                (version {doc.version}). {doc.summary}
              </span>
            </label>
          ))}
        </div>

        <div className="border-t border-slate-700 px-6 py-4">
          {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
          <button
            type="button"
            disabled={!allChecked || submitting}
            onClick={onAccept}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Recording…' : 'Accept and continue'}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            The agreement is with UrbanMove Services Private Limited, which operates JebDekho.
          </p>
        </div>
      </div>
    </div>
  );
}
