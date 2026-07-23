'use client';

import { useState } from 'react';
import { Button } from '@/design-system/primitives';

/**
 * OTP entry for a pickup or delivery handover.
 *
 * On a COD delivery the submit stays disabled until the rider ticks that they
 * took the cash. The server enforces this too — the tick here is so the rider
 * cannot complete the delivery having forgotten to collect.
 */
export function HandoverOtpForm({
  kind,
  codDue = false,
  codAmount = null,
  busy,
  error,
  onSubmit,
}: {
  kind: 'pickup' | 'delivery';
  codDue?: boolean;
  codAmount?: string | null;
  busy: boolean;
  error: string | null;
  onSubmit: (otp: string, codCollected: boolean) => void;
}) {
  const [otp, setOtp] = useState('');
  const [cash, setCash] = useState(false);
  const otpValid = otp.length >= 4 && otp.length <= 6;
  const codBlocking = kind === 'delivery' && codDue && !cash;
  const canSubmit = otpValid && !codBlocking && !busy;
  const title = kind === 'pickup' ? 'Verify pickup' : 'Verify delivery';
  const hint =
    kind === 'pickup'
      ? 'Enter the code the store shows you to confirm handover.'
      : 'Enter the code the customer reads out to complete delivery.';

  return (
    <div className="space-y-3 rounded-2xl border border-rider-border bg-rider-surface p-4">
      <div>
        <p className="text-sm font-bold text-rider-text">{title}</p>
        <p className="text-xs text-rider-muted">{hint}</p>
      </div>
      {kind === 'delivery' && codDue && (
        <div className="space-y-2 rounded-xl border border-rider-accent/40 bg-rider-accent/10 p-3">
          <p className="text-sm font-black text-rider-accent">⚠ Collect ₹{codAmount ?? '—'} cash</p>
          <label className="flex items-center gap-2 text-sm font-medium text-rider-text">
            <input
              type="checkbox"
              checked={cash}
              onChange={(e) => setCash(e.target.checked)}
              className="h-5 w-5"
            />
            I have collected the cash
          </label>
        </div>
      )}
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Enter code"
        aria-label={`${title} code`}
        className="h-14 w-full rounded-xl border-2 border-rider-border bg-rider-bg text-center text-2xl font-bold tracking-[0.4em] text-rider-text"
      />
      {error && <p role="alert" className="text-sm font-semibold text-rider-danger">{error}</p>}
      <Button size="lg" onClick={() => canSubmit && onSubmit(otp, cash)} disabled={!canSubmit}>
        {kind === 'pickup' ? 'Confirm pickup' : 'Complete delivery'}
      </Button>
    </div>
  );
}
