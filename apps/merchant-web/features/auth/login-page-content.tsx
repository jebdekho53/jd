'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useRequestOtpMutation, useVerifyOtpMutation, useSessionQuery } from '@/hooks/use-auth';
import { useToast } from '@/design-system/primitives';
import { Button, Input } from '@/design-system/primitives';
import { OtpInput } from './components/otp-input';

type Step = 'phone' | 'otp';

export function LoginPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSessionQuery();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  useEffect(() => {
    const u = session ?? user;
    if (u?.roles.includes('MERCHANT')) {
      router.replace('/dashboard');
    }
  }, [session, user, router]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handlePhone = async () => {
    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;
    try {
      await requestOtp.mutateAsync(formatted);
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      toast((err as Error).message ?? 'Failed to send OTP', 'error');
    }
  };

  const handleOtp = async () => {
    if (otp.length < 6) return;
    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;
    try {
      const result = await verifyOtp.mutateAsync({ phone: formatted, code: otp });
      if (!result.user.roles.includes('MERCHANT')) {
        toast('This account does not have merchant access.', 'error');
        setStep('phone');
        return;
      }
      toast('Signed in successfully!', 'success');
      router.replace('/dashboard');
    } catch (err) {
      toast((err as Error).message ?? 'Invalid OTP', 'error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">
            JD
          </div>
          <h1 className="text-xl font-bold text-slate-900">Merchant Login</h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 'phone' ? 'Enter your registered mobile number' : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <Input
              label="Mobile number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              maxLength={10}
              onKeyDown={(e) => e.key === 'Enter' && phone.length === 10 && handlePhone()}
            />
            <Button
              fullWidth
              loading={requestOtp.isPending}
              disabled={phone.length !== 10}
              onClick={handlePhone}
            >
              Send OTP
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">Enter 6-digit OTP</p>
              <OtpInput value={otp} onChange={setOtp} disabled={verifyOtp.isPending} />
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
                  onClick={() => { setOtp(''); handlePhone(); }}
                  className="text-sm text-brand-600 hover:underline"
                >
                  Resend OTP
                </button>
              )}
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); }}
                className="mt-1 block w-full text-sm text-slate-500 hover:text-slate-700"
              >
                Change number
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
