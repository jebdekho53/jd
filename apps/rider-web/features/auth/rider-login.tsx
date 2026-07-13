'use client';

import { useState } from 'react';
import { requestOtp, verifyOtp } from '@/lib/api';

export function RiderLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    setError(null);
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setBusy(true);
    try {
      await requestOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(phone, code);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">JebDekho</p>
        <h1 className="mt-1 text-3xl font-bold">Rider Partner</h1>
        <p className="mt-2 text-sm text-slate-400">
          {step === 'phone'
            ? 'Sign in with your registered mobile number.'
            : `Enter the OTP sent to your WhatsApp on +91 ${phone.replace(/\D/g, '').slice(-10)}.`}
        </p>

        {step === 'phone' ? (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3">
              <span className="text-sm text-slate-400">+91</span>
              <input
                inputMode="numeric"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                placeholder="Mobile number"
                className="h-12 flex-1 bg-transparent text-lg outline-none placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={sendOtp}
              disabled={busy}
              className="h-12 w-full rounded-xl bg-cyan-400 font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <input
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && code.length >= 4 && verify()}
              placeholder="6-digit OTP"
              className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-center text-2xl tracking-[0.4em] outline-none placeholder:tracking-normal placeholder:text-slate-600"
            />
            <button
              onClick={verify}
              disabled={busy || code.length < 4}
              className="h-12 w-full rounded-xl bg-cyan-400 font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? 'Verifying…' : 'Verify & Sign in'}
            </button>
            <button
              onClick={() => {
                setStep('phone');
                setCode('');
                setError(null);
              }}
              className="w-full text-sm text-slate-400"
            >
              Change number
            </button>
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      </div>
    </main>
  );
}
