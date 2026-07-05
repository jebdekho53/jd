'use client';

import { useEffect, useState } from 'react';
import { Button, Input } from '@/design-system/primitives';
import { OtpInput } from './otp-input';
import { useRequestOtpMutation, useVerifyOtpMutation } from '@/hooks/use-auth';
import type { VerifyOtpResult } from '@/types/auth';
import { useToast } from '@/design-system/primitives';
import { cn } from '@/lib/cn';
import { isPhoneOtpEnabled } from '@jebdekho/web-config';
import { MobileOtpComingSoonBanner } from '@/features/auth/components/auth-tabs';

type Step = 'identifier' | 'otp';
type LoginMode = 'phone' | 'email';

function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length < 4) return e164;
  return `+${digits.slice(0, 2)} ******${digits.slice(-4)}`;
}

function formatPhone(raw: string) {
  return raw.startsWith('+') ? raw : `+91${raw.replace(/^0/, '')}`;
}

export interface MerchantOtpFlowProps {
  onVerified: (result: VerifyOtpResult) => void | Promise<void>;
  submitLabel?: string;
  heading?: string;
}

export function MerchantOtpFlow({
  onVerified,
  submitLabel = 'Verify OTP',
  heading = 'Verify your identity',
}: MerchantOtpFlowProps) {
  const { toast } = useToast();
  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();
  const phoneOtpEnabled = isPhoneOtpEnabled();

  const [step, setStep] = useState<Step>('identifier');
  const [mode, setMode] = useState<LoginMode>(phoneOtpEnabled ? 'phone' : 'email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [resolvedPhone, setResolvedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const canSubmitIdentifier =
    mode === 'phone' ? phone.replace(/\D/g, '').length === 10 : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRequestOtp = async () => {
    try {
      if (mode === 'phone') {
        if (!phoneOtpEnabled) return;
        const formatted = formatPhone(phone);
        const result = await requestOtp.mutateAsync({ phone: formatted });
        setResolvedPhone(formatted);
        setStep('otp');
        setResendTimer(60);
        toast(result.message ?? 'OTP sent', 'success');
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const result = await requestOtp.mutateAsync({ email: normalizedEmail });
        if (!result.phone) {
          toast('No account with this email. Sign up to create a merchant account.', 'error');
          return;
        }
        setResolvedPhone(result.phone);
        setStep('otp');
        setResendTimer(60);
        toast(result.message ?? 'OTP sent to your email', 'success');
      }
    } catch (err) {
      toast((err as Error).message ?? 'Failed to send OTP', 'error');
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6 || !resolvedPhone) return;
    try {
      const result = await verifyOtp.mutateAsync({ phone: resolvedPhone, code: otp });
      await onVerified(result);
    } catch (err) {
      toast((err as Error).message ?? 'Invalid OTP', 'error');
    }
  };

  const otpDestination =
    mode === 'phone'
      ? `+91 ${phone.replace(/\D/g, '')}`
      : step === 'otp' && email.trim()
        ? email.trim().toLowerCase()
        : maskPhone(resolvedPhone);

  return (
    <div className="space-y-4">
      <h2 className="text-center text-sm font-semibold text-slate-700">{heading}</h2>

      {step === 'identifier' ? (
        <>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['phone', 'email'] as const).map((m) => {
              const isPhone = m === 'phone';
              const disabled = isPhone && !phoneOtpEnabled;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) setMode(m);
                  }}
                  className={cn(
                    'relative flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm font-semibold transition',
                    mode === m && !disabled
                      ? 'bg-white text-slate-900 shadow-sm'
                      : disabled
                        ? 'cursor-not-allowed text-slate-400'
                        : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {isPhone ? 'Mobile' : 'Email'}
                  {disabled ? (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      Soon
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {mode === 'phone' && !phoneOtpEnabled ? (
            <MobileOtpComingSoonBanner />
          ) : mode === 'phone' ? (
            <div className="flex gap-2">
              <span className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                +91
              </span>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile"
                maxLength={10}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && canSubmitIdentifier && handleRequestOtp()}
              />
            </div>
          ) : (
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@store.com"
              autoComplete="email"
              onKeyDown={(e) => e.key === 'Enter' && canSubmitIdentifier && handleRequestOtp()}
            />
          )}

          {(mode === 'email' || phoneOtpEnabled) && (
            <Button
              fullWidth
              loading={requestOtp.isPending}
              disabled={!canSubmitIdentifier || (mode === 'phone' && !phoneOtpEnabled)}
              onClick={handleRequestOtp}
            >
              Send OTP
            </Button>
          )}
        </>
      ) : (
        <>
          <p className="text-center text-sm text-slate-500">
            OTP sent to {mode === 'email' ? email.trim().toLowerCase() || otpDestination : otpDestination}
          </p>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <OtpInput value={otp} onChange={setOtp} disabled={verifyOtp.isPending} />
          </div>
          <Button
            fullWidth
            loading={verifyOtp.isPending}
            disabled={otp.length !== 6}
            onClick={handleVerify}
          >
            {submitLabel}
          </Button>
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-slate-500">Resend in {resendTimer}s</p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOtp('');
                  handleRequestOtp();
                }}
                className="text-sm text-brand-600 hover:underline"
              >
                Resend OTP
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setStep('identifier');
                setOtp('');
                setResolvedPhone('');
              }}
              className="mt-1 block w-full text-sm text-slate-500 hover:text-slate-700"
            >
              Change {mode === 'phone' ? 'number' : 'email'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}