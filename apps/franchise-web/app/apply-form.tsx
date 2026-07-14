'use client';

import { useState } from 'react';

const INPUT =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none';

export function ApplyForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincodes: '',
    investmentCapacity: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const pincodes = form.pincodes
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: `+91${form.phone.replace(/\D/g, '').slice(-10)}`,
        email: form.email || undefined,
        city: form.city,
        state: form.state,
        pincodes: pincodes.length ? pincodes : undefined,
        investmentCapacity: form.investmentCapacity
          ? Number(form.investmentCapacity)
          : undefined,
        notes: form.notes || undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(json?.message ?? 'Could not submit your application. Please try again.');
      return;
    }
    setDone(json?.message ?? 'Application received. Our team will contact you shortly.');
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-300">Thank you</p>
        <p className="mt-2 text-sm text-slate-300">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={INPUT} placeholder="Full name" value={form.name} onChange={set('name')} required />
        <input
          className={INPUT}
          type="tel"
          inputMode="numeric"
          placeholder="Mobile number"
          value={form.phone}
          onChange={set('phone')}
          required
        />
      </div>

      <input className={INPUT} type="email" placeholder="Email (optional)" value={form.email} onChange={set('email')} />

      <div className="grid gap-3 sm:grid-cols-2">
        <input className={INPUT} placeholder="City" value={form.city} onChange={set('city')} required />
        <input className={INPUT} placeholder="State" value={form.state} onChange={set('state')} required />
      </div>

      <div>
        <input
          className={INPUT}
          placeholder="Pincodes you want to cover, e.g. 201001, 201002"
          value={form.pincodes}
          onChange={set('pincodes')}
        />
        <p className="mt-1 text-xs text-slate-500">
          Each territory is exclusive to one partner.
        </p>
      </div>

      <input
        className={INPUT}
        type="number"
        min={0}
        placeholder="Investment capacity in ₹ (optional)"
        value={form.investmentCapacity}
        onChange={set('investmentCapacity')}
      />

      <textarea
        className={`${INPUT} min-h-24`}
        placeholder="Tell us about your business background (optional)"
        value={form.notes}
        onChange={set('notes')}
      />

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Apply for a franchise'}
      </button>
    </form>
  );
}
