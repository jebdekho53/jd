'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type Mode = 'otp' | 'password';

const INPUT =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none';
const BUTTON =
  'w-full rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50';

async function post(path: string, body: unknown): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, message: json?.message };
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<Mode>('otp');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('error') === 'not_a_partner'
      ? 'That account is not a franchise partner.'
      : null,
  );

  function normalisePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(-10);
    return `+91${digits}`;
  }

  async function sendOtp() {
    setBusy(true);
    setError(null);
    const res = await post('/api/auth/request-otp', { phone: normalisePhone(phone) });
    setBusy(false);
    if (!res.ok) return setError(res.message ?? 'Could not send the code.');
    setOtpSent(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res =
      mode === 'otp'
        ? await post('/api/auth/verify-otp', { phone: normalisePhone(phone), code })
        : await post('/api/auth/login', { email, password });

    setBusy(false);
    if (!res.ok) return setError(res.message ?? 'Login failed.');

    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-5 flex gap-1 rounded-lg bg-slate-900 p-1">
        {(['otp', 'password'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === m ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m === 'otp' ? 'Phone OTP' : 'Email & password'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'otp' ? (
          <>
            <input
              className={INPUT}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={otpSent}
              required
            />
            {otpSent && (
              <input
                className={INPUT}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            )}
          </>
        ) : (
          <>
            <input
              className={INPUT}
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={INPUT}
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        {mode === 'otp' && !otpSent ? (
          <button type="button" onClick={sendOtp} disabled={busy || !phone} className={BUTTON}>
            {busy ? 'Sending…' : 'Send code'}
          </button>
        ) : (
          <button type="submit" disabled={busy} className={BUTTON}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        )}
      </form>

      {mode === 'otp' && otpSent && (
        <button
          type="button"
          onClick={() => {
            setOtpSent(false);
            setCode('');
          }}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-200"
        >
          Use a different number
        </button>
      )}
    </div>
  );
}
