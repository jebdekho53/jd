'use client';

import Link from 'next/link';
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
    <main className="flex min-h-screen flex-col justify-center bg-rider-bg px-6 py-12 text-rider-text">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-rider-accent">JebDekho</p>
        <h1 className="mt-1 text-3xl font-black">Rider Partner</h1>
        <p className="mt-2 text-sm text-rider-muted">
          {step === 'phone'
            ? 'Sign in or sign up with your mobile number.'
            : `Enter the OTP sent to your WhatsApp on +91 ${phone.replace(/\D/g, '').slice(-10)}.`}
        </p>

        {step === 'phone' ? (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-rider-border bg-rider-surface px-3">
              <span className="text-sm text-rider-muted">+91</span>
              <input
                inputMode="numeric"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                placeholder="Mobile number"
                className="h-12 flex-1 bg-transparent text-lg outline-none placeholder:text-rider-muted"
              />
            </div>
            <button
              onClick={sendOtp}
              disabled={busy}
              className="h-14 w-full rounded-xl bg-rider-accent font-bold text-rider-accent-foreground disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send OTP'}
            </button>
            <div className="rounded-xl border border-rider-border bg-rider-surface p-4">
              <p className="text-sm font-bold text-rider-text">New to JebDekho?</p>
              <p className="mt-1 text-sm text-rider-muted">
                No separate signup needed. Enter your mobile number above and we will set up your
                delivery partner profile right after the OTP.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-rider-muted">
                <li>1. Verify your mobile number with OTP</li>
                <li>2. Add your name and vehicle details</li>
                <li>3. Upload KYC documents and start earning</li>
              </ul>
            </div>
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
              className="h-14 w-full rounded-xl border border-rider-border bg-rider-surface px-4 text-center text-2xl tracking-[0.4em] outline-none placeholder:tracking-normal placeholder:text-rider-muted"
            />
            <button
              onClick={verify}
              disabled={busy || code.length < 4}
              className="h-14 w-full rounded-xl bg-rider-accent font-bold text-rider-accent-foreground disabled:opacity-60"
            >
              {busy ? 'Verifying…' : 'Verify & Sign in'}
            </button>
            <button
              onClick={() => {
                setStep('phone');
                setCode('');
                setError(null);
              }}
              className="w-full text-sm text-rider-muted"
            >
              Change number
            </button>
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-rider-danger/10 p-3 text-sm text-rider-danger">{error}</p>}

        <nav className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-rider-muted">
          <Link href="/about" className="hover:text-rider-text">How it works</Link>
          <Link href="/help" className="hover:text-rider-text">Help</Link>
          <Link href="/faq" className="hover:text-rider-text">FAQ</Link>
          <Link href="/agreement" className="hover:text-rider-text">Agreement</Link>
          <Link href="/privacy" className="hover:text-rider-text">Privacy</Link>
          <Link href="/contact" className="hover:text-rider-text">Contact</Link>
        </nav>
      </div>
    </main>
  );
}
