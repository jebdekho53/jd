'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useRequestOtpMutation, useVerifyOtpMutation, useSessionQuery } from '@/hooks/use-auth';
import { useToast } from '@/design-system/primitives';
import { Button, Input } from '@/design-system/primitives';
import { OtpInput } from './components/otp-input';
import {
  DEMO_MERCHANT_ACCOUNTS,
  DEMO_OTP,
  IS_DEV,
} from '@/lib/demo-auth';
import { cn } from '@/lib/cn';

type Step = 'identifier' | 'otp';
type LoginMode = 'phone' | 'email';

function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length < 4) return e164;
  return `+${digits.slice(0, 2)} ******${digits.slice(-4)}`;
}

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: session } = useSessionQuery();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('identifier');
  const [mode, setMode] = useState<LoginMode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [resolvedPhone, setResolvedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  const notMerchantError = searchParams.get('error') === 'not_merchant';

  useEffect(() => {
    const u = session ?? user;
    if (u?.roles.includes('MERCHANT')) {
      router.replace('/dashboard');
    }
  }, [session, user, router]);

  useEffect(() => {
    if (notMerchantError) {
      toast('This account does not have merchant access.', 'error');
    }
  }, [notMerchantError, toast]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const formatPhone = (raw: string) =>
    raw.startsWith('+') ? raw : `+91${raw.replace(/^0/, '')}`;

  const handleRequestOtp = async () => {
    try {
      if (mode === 'phone') {
        const formatted = formatPhone(phone);
        const result = await requestOtp.mutateAsync({ phone: formatted });
        setResolvedPhone(formatted);
        setStep('otp');
        setResendTimer(60);
        toast(result.message, 'success');
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const result = await requestOtp.mutateAsync({ email: normalizedEmail });
        if (!result.phone) {
          toast('Could not resolve phone for this email', 'error');
          return;
        }
        setResolvedPhone(result.phone);
        setStep('otp');
        setResendTimer(60);
        toast(result.message, 'success');
      }
    } catch (err) {
      toast((err as Error).message ?? 'Failed to send OTP', 'error');
    }
  };

  const handleOtp = async () => {
    if (otp.length < 6 || !resolvedPhone) return;
    try {
      const result = await verifyOtp.mutateAsync({ phone: resolvedPhone, code: otp });
      if (!result.user.roles.includes('MERCHANT')) {
        toast('This account does not have merchant access.', 'error');
        setStep('identifier');
        setOtp('');
        return;
      }
      toast('Signed in successfully!', 'success');
      router.replace('/dashboard');
    } catch (err) {
      toast((err as Error).message ?? 'Invalid OTP', 'error');
    }
  };

  const otpDestination =
    mode === 'phone'
      ? `+91 ${phone}`
      : maskPhone(resolvedPhone);

  const canSubmitIdentifier =
    mode === 'phone' ? phone.length === 10 : email.includes('@');

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">
            JD
          </div>
          <h1 className="text-xl font-bold text-slate-900">Merchant Login</h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 'identifier'
              ? 'Sign in with mobile number or email'
              : `OTP sent to ${otpDestination}`}
          </p>
        </div>

        {IS_DEV && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left text-xs text-amber-900">
            <p className="font-semibold">Demo credentials</p>
            <p className="mt-1">
              OTP: <span className="font-mono">{DEMO_OTP}</span> (all accounts)
            </p>
            <ul className="mt-2 space-y-2">
              {DEMO_MERCHANT_ACCOUNTS.map((account) => (
                <li key={account.phoneDigits}>
                  <p className="font-medium">{account.label}</p>
                  <p>
                    Phone: <span className="font-mono">{account.phoneDigits}</span>
                  </p>
                  <p>
                    Email: <span className="font-mono">{account.email}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 'identifier' ? (
          <div className="space-y-4">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(['phone', 'email'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-semibold transition',
                    mode === m
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {m === 'phone' ? 'Mobile' : 'Email'}
                </button>
              ))}
            </div>

            {mode === 'phone' ? (
              <Input
                label="Mobile number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile"
                maxLength={10}
                onKeyDown={(e) => e.key === 'Enter' && canSubmitIdentifier && handleRequestOtp()}
              />
            ) : (
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@store.com"
                autoComplete="email"
                onKeyDown={(e) => e.key === 'Enter' && canSubmitIdentifier && handleRequestOtp()}
              />
            )}

            <Button
              fullWidth
              loading={requestOtp.isPending}
              disabled={!canSubmitIdentifier}
              onClick={handleRequestOtp}
            >
              Send OTP
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="mb-3 text-center text-sm font-medium text-slate-700">
                Enter 6-digit OTP
              </p>
              <OtpInput value={otp} onChange={setOtp} disabled={verifyOtp.isPending} />
              {IS_DEV && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Dev OTP: <span className="font-mono font-semibold text-slate-700">{DEMO_OTP}</span>
                </p>
              )}
            </div>
            <Button
              fullWidth
              loading={verifyOtp.isPending}
              disabled={otp.length !== 6}
              onClick={handleOtp}
            >
              Verify &amp; Sign in
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
                {mode === 'phone' ? 'Change number' : 'Change email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
