'use client';

import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Download, Share2, Upload } from 'lucide-react';

interface Profile {
  businessName: string;
  city: string | null;
  address: string | null;
  photoUrl: string | null;
}

const CARD_SRC = '/api/franchise/marketing-card';

function CardInner() {
  const qc = useQueryClient();
  const [address, setAddress] = useState('');
  const [cardV, setCardV] = useState(() => Date.now()); // cache-buster for the preview
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery<Profile>({
    queryKey: ['franchise', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/franchise/profile');
      const json = await res.json();
      return json.data;
    },
  });

  useEffect(() => {
    if (profile && address === '') setAddress(profile.address ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const refreshCard = () => {
    qc.invalidateQueries({ queryKey: ['franchise', 'profile'] });
    setCardV(Date.now());
  };

  const saveAddress = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/franchise/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Could not save');
    },
    onSuccess: refreshCard,
  });

  const onPhoto = async (file: File) => {
    setErr(null);
    setBusy('photo');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error('Could not read the image'));
        r.readAsDataURL(file);
      });
      const up = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dataUrl, purpose: 'owner-photo' }),
      });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.message ?? 'Upload failed');
      const save = await fetch('/api/franchise/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ photoUrl: upJson.data.url }),
      });
      if (!save.ok) throw new Error((await save.json()).message ?? 'Could not save the photo');
      refreshCard();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const getCardFile = async (): Promise<File> => {
    const res = await fetch(`${CARD_SRC}?t=${Date.now()}`);
    if (!res.ok) throw new Error('Could not generate the card');
    const blob = await res.blob();
    return new File([blob], 'jebdekho-partner-card.png', { type: 'image/png' });
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
        await nav.share({ files: [file], title: 'JebDekho', text: 'Join JebDekho — scan my card!' });
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
    <div className="max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold text-white">My card</h1>
      <p className="mb-6 text-sm text-slate-400">
        Your ready-to-share JebDekho card. Post it on WhatsApp — anyone who scans the QR and signs up is attributed to you.
      </p>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        {/* Details */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Your photo</h2>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-800">
                {profile?.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoUrl} alt="Owner" className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPhoto(f);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy === 'photo'}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" /> {busy === 'photo' ? 'Uploading…' : 'Upload photo'}
                </button>
                <p className="mt-1.5 text-xs text-slate-500">Square photo works best. Min 256×256.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Address on the card</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Shop / office address shown on your card"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            <button
              onClick={() => saveAddress.mutate()}
              disabled={saveAddress.isPending}
              className="mt-3 rounded-lg bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              {saveAddress.isPending ? 'Saving…' : 'Save address'}
            </button>
          </div>

          {err && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}
        </div>

        {/* Preview + actions */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${CARD_SRC}?t=${cardV}`} alt="Your JebDekho card" className="w-full" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={download}
              disabled={!!busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Download
            </button>
            <button
              onClick={share}
              disabled={!!busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <CardInner />
    </QueryClientProvider>
  );
}
