'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveStepUp, useStepUpOpen } from '@/store/ui-modals-store';
import { getMe, requestOtp } from '@/lib/api';
import { Button } from '@/design-system/primitives';

/** Shown whenever a sensitive action (currently: changing payout bank/UPI
 *  details) gets a 403 "Step-Up Required" from the API — the rider re-proves
 *  it's really them via a fresh OTP before the original request is retried. */
export function StepUpModal() {
  const open = useStepUpOpen();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe, enabled: open });
  const phone = me.data?.user.phone;

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setOtp('');
      setOtpSent(false);
      setCountdown(0);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  if (!open) return null;

  const sendOtp = async () => {
    if (!phone) {
      setError('Could not find your phone number — try again.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestOtp(phone);
      setOtpSent(true);
      setCountdown(60);
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/step-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      const body = await res.json();
      if (!res.ok || body?.success === false) {
        throw new Error(body?.message ?? 'Verification failed');
      }
      resolveStepUp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl border border-rider-border bg-rider-surface p-5 sm:rounded-3xl">
        <p className="text-lg font-black text-rider-text">Security check</p>
        <p className="mt-1 text-sm text-rider-muted">
          Re-verify your number before changing payout details — this protects your earnings if
          your session is ever compromised.
        </p>

        {error && <p className="mt-3 rounded-xl bg-rider-danger/10 p-3 text-sm text-rider-danger">{error}</p>}

        <div className="mt-4 space-y-3">
          {otpSent ? (
            <>
              <input
                ref={otpRef}
                inputMode="numeric"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && otp.length >= 4 && verify()}
                placeholder="6-digit OTP"
                className="h-14 w-full rounded-xl border border-rider-border bg-rider-bg px-4 text-center text-2xl tracking-[0.4em] text-rider-text outline-none placeholder:tracking-normal placeholder:text-rider-muted"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-rider-muted">Sent to +91 {phone?.replace(/\D/g, '').slice(-10)}</span>
                {countdown > 0 ? (
                  <span className="text-rider-muted">Resend in {countdown}s</span>
                ) : (
                  <button onClick={sendOtp} disabled={busy} className="font-bold text-rider-accent">
                    Resend
                  </button>
                )}
              </div>
            </>
          ) : (
            <Button onClick={sendOtp} disabled={busy || !phone} size="lg">
              {busy ? 'Sending…' : 'Send OTP'}
            </Button>
          )}

          {otpSent ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="outline" onClick={() => resolveStepUp(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={verify} disabled={busy || otp.length < 4}>
                {busy ? 'Verifying…' : 'Verify'}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => resolveStepUp(false)}
              disabled={busy}
              className="w-full pt-1 text-center text-sm font-semibold text-rider-muted"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
