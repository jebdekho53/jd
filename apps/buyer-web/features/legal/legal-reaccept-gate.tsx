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
 * Proactive prompt at the buyer's transaction boundary (checkout). When the API
 * reports the buyer owes acceptance of the current Terms, it overlays checkout
 * with an accept modal. It deliberately wraps only this flow — the storefront is
 * browsable without an account.
 *
 * Fail-OPEN by design. The real enforcement is server-side: the order-create
 * endpoints reject with a 403 `LEGAL_ACCEPTANCE_REQUIRED` until acceptance is on
 * record. So this only blocks on a *definitive* pending list — loading, a
 * network error, a 401, or a malformed response fall through so a blip never
 * stops a paying customer, and the backend stays the backstop.
 */
export function LegalReacceptGate({
  portal = 'buyer',
  agreementHref = '/terms',
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

  const blocking = Boolean(docs && docs.length > 0);

  const allChecked = (docs ?? []).every((doc) => checked[doc.code]);
  const reacceptance = (docs ?? []).some((doc) => doc.isReacceptance);

  const onAccept = async () => {
    if (!docs) return;
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
    <>
      {children}
      {blocking && docs && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-reaccept-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="border-b border-border px-6 py-4">
              <h2 id="legal-reaccept-title" className="text-base font-semibold">
                {reacceptance ? 'Updated Terms — please review' : 'One more step'}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {reacceptance
                  ? 'We have updated the terms that apply to your orders. Please review and accept the latest version to place this order.'
                  : 'Please review and accept the following to place your order.'}
              </p>
            </div>

            <div className="max-h-[50vh] space-y-4 overflow-y-auto px-6 py-4">
              {docs.map((doc) => (
                <label
                  key={doc.code}
                  className="flex cursor-pointer select-none items-start gap-2.5 rounded-lg border border-border p-3"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checked[doc.code])}
                    disabled={submitting}
                    onChange={(e) =>
                      setChecked((prev) => ({ ...prev, [doc.code]: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    I have read and accept the{' '}
                    <Link
                      href={agreementHref}
                      target="_blank"
                      className="font-medium text-primary hover:underline"
                    >
                      {doc.title}
                    </Link>{' '}
                    (version {doc.version}). {doc.summary}
                  </span>
                </label>
              ))}
            </div>

            <div className="border-t border-border px-6 py-4">
              {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
              <button
                type="button"
                disabled={!allChecked || submitting}
                onClick={onAccept}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Recording…' : 'Accept and continue'}
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Your order is with UrbanMove Services Private Limited, which operates JebDekho.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
