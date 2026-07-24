'use client';

import { useState } from 'react';

const INPUT =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none';

const VENDOR_TYPES = [
  { value: 'BRAND', label: 'Brand' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'IMPORTER', label: 'Importer' },
  { value: 'LOCAL_SUPPLIER', label: 'Local supplier' },
];

export function ApplyForm() {
  const [form, setForm] = useState({
    businessName: '',
    vendorType: VENDOR_TYPES[0].value,
    phone: '',
    email: '',
    password: '',
    line1: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch('/api/vendor-applications/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: form.businessName,
        vendorType: form.vendorType,
        phone: `+91${form.phone.replace(/\D/g, '').slice(-10)}`,
        email: form.email,
        password: form.password,
        line1: form.line1 || undefined,
        pincode: form.pincode || undefined,
        gstNumber: form.gstNumber || undefined,
        panNumber: form.panNumber || undefined,
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
      <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-violet-300">Thank you</p>
        <p className="mt-2 text-sm text-slate-300">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={INPUT}
          placeholder="Business name"
          value={form.businessName}
          onChange={set('businessName')}
          required
        />
        <select className={INPUT} value={form.vendorType} onChange={set('vendorType')} required>
          {VENDOR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={INPUT}
          type="tel"
          inputMode="numeric"
          placeholder="Mobile number"
          value={form.phone}
          onChange={set('phone')}
          required
        />
        <input
          className={INPUT}
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={set('email')}
          required
        />
      </div>

      {/* The portal's password sign-in resolves the account by email, so both are
          required — a partner with neither could only ever get in by phone OTP. */}
      <input
        className={INPUT}
        type="password"
        placeholder="Choose a password (min 8 characters)"
        value={form.password}
        onChange={set('password')}
        minLength={8}
        autoComplete="new-password"
        required
      />
      <p className="-mt-2 text-xs text-slate-400">
        You&apos;ll sign in to the vendor portal with this email and password once approved.
      </p>

      <input
        className={INPUT}
        placeholder="Address (optional)"
        value={form.line1}
        onChange={set('line1')}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={INPUT}
          placeholder="Pincode (optional)"
          value={form.pincode}
          onChange={set('pincode')}
        />
        <input
          className={INPUT}
          placeholder="GST number (optional)"
          value={form.gstNumber}
          onChange={set('gstNumber')}
        />
      </div>

      <input
        className={INPUT}
        placeholder="PAN number (optional)"
        value={form.panNumber}
        onChange={set('panNumber')}
      />

      <textarea
        className={`${INPUT} min-h-24`}
        placeholder="Tell us about the products you supply (optional)"
        value={form.notes}
        onChange={set('notes')}
      />

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-violet-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-300 disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Apply to become a vendor'}
      </button>
    </form>
  );
}
