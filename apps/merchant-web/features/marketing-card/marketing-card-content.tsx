'use client';

import { useState } from 'react';
import { Download, Share2 } from 'lucide-react';

const CARD_SRC = '/api/merchant/marketing-card';

export function MarketingCardContent() {
  const [cardV] = useState(() => Date.now()); // cache-buster for the preview
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const getCardFile = async (): Promise<File> => {
    const res = await fetch(`${CARD_SRC}?t=${Date.now()}`);
    if (!res.ok) throw new Error('Could not generate your card. Add a store logo or owner photo first.');
    const blob = await res.blob();
    return new File([blob], 'jebdekho-store-card.png', { type: 'image/png' });
  };

  const download = async () => {
    setBusy('download');
    setErr(null);
    try {
      const file = await getCardFile();
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy('share');
    setErr(null);
    try {
      const file = await getCardFile();
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: 'JebDekho', text: 'Shop from my store on JebDekho — scan the QR!' });
      } else {
        await download();
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <p className="mb-6 text-sm text-slate-600">
        Your ready-to-share store card, with your photo, contact details and a QR code that opens your
        store. Post it on WhatsApp or print it — customers who scan it land straight on your shop.
      </p>

      <div className="grid gap-6 md:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${CARD_SRC}?t=${cardV}`} alt="Your JebDekho store card" className="w-full" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={download}
              disabled={!!busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> {busy === 'download' ? 'Preparing…' : 'Download'}
            </button>
            <button
              onClick={share}
              disabled={!!busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" /> {busy === 'share' ? 'Sharing…' : 'Share'}
            </button>
          </div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          <h2 className="mb-2 font-semibold text-slate-800">What&apos;s on the card?</h2>
          <ul className="space-y-1.5">
            <li>• Your photo (set it in onboarding under “Your photo”)</li>
            <li>• Store name, phone and address</li>
            <li>• A QR code linking straight to your store page</li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            To change the photo, update it in your store onboarding details.
          </p>
        </div>
      </div>
    </div>
  );
}
