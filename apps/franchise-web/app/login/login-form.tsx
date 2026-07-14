'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

/**
 * `set-password` exists because a partner who was already a JebDekho buyer keeps
 * their existing account at approval, and approval deliberately does NOT copy the
 * password chosen on the public application form onto a pre-existing account (the
 * form is unauthenticated — anyone could enter someone else's number). Proving
 * ownership with an OTP is what makes setting the password safe.
 */
type Mode = 'otp' | 'password' | 'set-password';

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
  const [newPassword, setNewPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
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

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setOtpSent(false);
    setCode('');
  }

  async function sendOtp() {
    setBusy(true);
    setError(null);
    // Setting a password needs a PASSWORD_RESET OTP, not a login OTP.
    const res = await post(
      mode === 'set-password' ? '/api/auth/forgot-password' : '/api/auth/request-otp',
      { phone: normalisePhone(phone) },
    );
    setBusy(false);
    if (!res.ok) return setError(res.message ?? 'Could not send the code.');
    setOtpSent(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (mode === 'set-password') {
      const res = await post('/api/auth/reset-password', {
        phone: normalisePhone(phone),
        code,
        newPassword,
      });
      setBusy(false);
      if (!res.ok) return setError(res.message ?? 'Could not set the password.');
      setNotice('Password set. Sign in with your email and password.');
      switchMode('password');
      return;
    }

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
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === m ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m === 'otp' ? 'Phone OTP' : 'Email & password'}
          </button>
        ))}
      </div>

      {notice && (
        <p className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {notice}
        </p>
      )}

      <form onSubmit={submit} className="space-y-3">
        {mode === 'otp' || mode === 'set-password' ? (
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
            {mode === 'set-password' && otpSent && (
              <input
                className={INPUT}
                type="password"
                autoComplete="new-password"
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
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

        {(mode === 'otp' || mode === 'set-password') && !otpSent ? (
          <button type="button" onClick={sendOtp} disabled={busy || !phone} className={BUTTON}>
            {busy ? 'Sending…' : 'Send code'}
          </button>
        ) : (
          <button type="submit" disabled={busy} className={BUTTON}>
            {busy
              ? mode === 'set-password'
                ? 'Saving…'
                : 'Signing in…'
              : mode === 'set-password'
                ? 'Set password'
                : 'Sign in'}
          </button>
        )}
      </form>

      {mode === 'password' && (
        <button
          type="button"
          onClick={() => switchMode('set-password')}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-200"
        >
          No password yet, or forgot it? Set one with an OTP
        </button>
      )}

      {mode === 'set-password' && (
        <button
          type="button"
          onClick={() => switchMode('password')}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-200"
        >
          ← Back to sign in
        </button>
      )}

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
