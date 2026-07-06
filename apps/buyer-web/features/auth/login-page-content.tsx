'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button, Input, PasswordInput } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthTabs, MobileOtpComingSoonBanner } from '@/features/auth/components/auth-tabs';
import { AuthSwitchLink } from '@/features/auth/components/auth-switch-link';
import { SocialLogin } from '@/features/auth/components/social-login';
import { OtpInput } from '@/features/auth/components/otp-input';
import { PhoneInput } from '@/features/auth/components/phone-input';
import { applyAuthSession } from '@/features/auth/auth-provider';
import { mergeGuestCartIntoServer } from '@/lib/merge-guest-cart';
import {
  useEmailLoginMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  SessionError,
} from '@/hooks/use-auth';
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone';
import { safeReturnUrl } from '@jebdekho/web-config';
import { isPhoneOtpEnabled } from '@jebdekho/web-config';

type LoginTab = 'mobile' | 'email';
type MobileStep = 'phone' | 'otp';

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a 10-digit mobile number')
    .refine(isValidIndianPhone, 'Enter a valid Indian mobile number'),
});

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type EmailForm = z.infer<typeof emailSchema>;

export function LoginPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const returnUrl = safeReturnUrl(searchParams.get('returnUrl'));
  const phoneOtpEnabled = isPhoneOtpEnabled();

  const [tab, setTab] = useState<LoginTab>(phoneOtpEnabled ? 'mobile' : 'email');
  const [mobileStep, setMobileStep] = useState<MobileStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();
  const emailLogin = useEmailLoginMutation();

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const sendOtp = async (phoneDigits: string) => {
    const e164 = normalizeIndianPhone(phoneDigits);
    setPhone(e164);
    try {
      const result = await requestOtp.mutateAsync({ phone: e164 });
      setMobileStep('otp');
      setOtp('');
      setOtpError(null);
      setResendSeconds(result.expiresIn ?? 300);
      toast('OTP sent to your phone', 'success');
    } catch (err) {
      const msg =
        err instanceof SessionError
          ? err.status === 429
            ? 'Too many OTP requests. Please wait and try again.'
            : err.message
          : 'Failed to send OTP';
      toast(msg, 'error');
    }
  };

  const onPhoneSubmit = phoneForm.handleSubmit(async ({ phone: digits }) => {
    await sendOtp(digits);
  });

  const completeLogin = async (user: Parameters<typeof applyAuthSession>[0], isNewUser: boolean) => {
    applyAuthSession(user, isNewUser);
    await mergeGuestCartIntoServer(queryClient);
    toast('Logged in successfully', 'success');
    router.replace(isNewUser ? '/onboarding' : returnUrl);
  };

  const onVerifyOtp = async () => {
    if (otp.length < 6) {
      setOtpError('Enter the complete 6-digit OTP');
      return;
    }
    setOtpError(null);
    try {
      const result = await verifyOtp.mutateAsync({ phone, code: otp, rememberMe });
      await completeLogin(result.user, result.isNewUser);
    } catch (err) {
      const msg =
        err instanceof SessionError
          ? err.message.includes('expired') || err.message.includes('Invalid')
            ? 'Invalid or expired OTP. Request a new one.'
            : err.message
          : 'Verification failed';
      setOtpError(msg);
      toast(msg, 'error');
    }
  };

  const onEmailSubmit = emailForm.handleSubmit(async (values) => {
    try {
      const result = await emailLogin.mutateAsync({ ...values, rememberMe });
      await completeLogin(result.user, result.isNewUser);
    } catch (err) {
      const msg = err instanceof SessionError ? err.message : 'Login failed';
      toast(msg, 'error');
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Login to continue shopping from nearby stores"
      footer={<AuthSwitchLink prompt="Don't have an account?" linkText="Sign Up" href="/signup" />}
    >
      <AuthTabs
        tabs={[
          {
            id: 'mobile',
            label: 'Mobile Number',
            disabled: !phoneOtpEnabled,
            badge: phoneOtpEnabled ? undefined : 'Coming Soon',
          },
          { id: 'email', label: 'Email' },
        ]}
        active={tab}
        onChange={(next) => {
          setTab(next);
          setMobileStep('phone');
          setOtp('');
          setOtpError(null);
        }}
      />

      {!phoneOtpEnabled && tab === 'mobile' && <MobileOtpComingSoonBanner className="mb-5" />}

      {tab === 'mobile' && phoneOtpEnabled && mobileStep === 'phone' && (
        <form onSubmit={onPhoneSubmit} className="space-y-5">
          <PhoneInput
            value={phoneForm.watch('phone')}
            onChange={(v) => phoneForm.setValue('phone', v, { shouldValidate: true })}
            error={phoneForm.formState.errors.phone?.message}
            disabled={requestOtp.isPending}
          />
          <Button type="submit" fullWidth loading={requestOtp.isPending}>
            Send OTP
          </Button>
        </form>
      )}

      {tab === 'mobile' && phoneOtpEnabled && mobileStep === 'otp' && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-jd-text-muted">
              OTP sent to <span className="font-medium text-neutral-900">{phone}</span>
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-jd-primary hover:underline"
              onClick={() => {
                setMobileStep('phone');
                setOtp('');
              }}
            >
              Change number
            </button>
          </div>

          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={verifyOtp.isPending}
            error={otpError ?? undefined}
          />

          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <span className="text-sm text-jd-text-secondary">Remember me</span>
          </label>

          <Button fullWidth loading={verifyOtp.isPending} onClick={onVerifyOtp}>
            Verify &amp; Login
          </Button>

          <div className="text-center">
            {resendSeconds > 0 ? (
              <p className="text-xs text-jd-text-muted">Resend OTP in {resendSeconds}s</p>
            ) : (
              <button
                type="button"
                className="text-sm font-medium text-jd-primary hover:underline"
                onClick={() => sendOtp(phone.replace(/^\+91/, ''))}
                disabled={requestOtp.isPending}
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'email' && (
        <form onSubmit={onEmailSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register('email')}
          />
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={emailForm.formState.errors.password?.message}
            {...emailForm.register('password')}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              <span className="text-sm text-jd-text-secondary">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-jd-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          <Button type="submit" fullWidth loading={emailLogin.isPending}>
            Login
          </Button>
        </form>
      )}

      <div className="mt-6">
        <SocialLogin />
      </div>
    </AuthShell>
  );
}
