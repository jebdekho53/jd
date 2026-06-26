'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthTabs } from '@/features/auth/components/auth-tabs';
import { AuthSwitchLink } from '@/features/auth/components/auth-switch-link';
import { SocialLogin } from '@/features/auth/components/social-login';
import { OtpInput } from '@/features/auth/components/otp-input';
import { PhoneInput } from '@/features/auth/components/phone-input';
import { applyAuthSession } from '@/features/auth/auth-provider';
import { mergeGuestCartIntoServer } from '@/lib/merge-guest-cart';
import {
  useEmailSignupMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  SessionError,
} from '@/hooks/use-auth';
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone';

type SignupTab = 'mobile' | 'email';
type MobileStep = 'details' | 'otp';

const mobileSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  phone: z
    .string()
    .min(10, 'Enter a 10-digit mobile number')
    .refine(isValidIndianPhone, 'Enter a valid Indian mobile number'),
  referralCode: z.string().optional(),
});

const emailSchema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type MobileForm = z.infer<typeof mobileSchema>;
type EmailForm = z.infer<typeof emailSchema>;

export function SignupPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState<SignupTab>('mobile');
  const [mobileStep, setMobileStep] = useState<MobileStep>('details');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState<string | undefined>();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();
  const emailSignup = useEmailSignupMutation();

  const mobileForm = useForm<MobileForm>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { name: '', phone: '', referralCode: '' },
  });

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', referralCode: '' },
  });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const onMobileDetailsSubmit = mobileForm.handleSubmit(async (values) => {
    const e164 = normalizeIndianPhone(values.phone);
    setPhone(e164);
    setName(values.name.trim());
    setReferralCode(values.referralCode?.trim() || undefined);
    try {
      const result = await requestOtp.mutateAsync({ phone: e164 });
      setMobileStep('otp');
      setOtp('');
      setOtpError(null);
      setResendSeconds(result.expiresIn ?? 300);
      toast('OTP sent to your phone', 'success');
    } catch (err) {
      const msg = err instanceof SessionError ? err.message : 'Failed to send OTP';
      toast(msg, 'error');
    }
  });

  const onVerifyAndCreate = async () => {
    if (otp.length < 6) {
      setOtpError('Enter the complete 6-digit OTP');
      return;
    }
    setOtpError(null);
    try {
      const result = await verifyOtp.mutateAsync({
        phone,
        code: otp,
        name,
        referralCode,
      });
      applyAuthSession(result.user, result.isNewUser);
      await mergeGuestCartIntoServer(queryClient);
      toast('Account created successfully', 'success');
      router.replace('/onboarding');
    } catch (err) {
      const msg = err instanceof SessionError ? err.message : 'Verification failed';
      setOtpError(msg);
      toast(msg, 'error');
    }
  };

  const onEmailSubmit = emailForm.handleSubmit(async (values) => {
    try {
      const result = await emailSignup.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        referralCode: values.referralCode?.trim() || undefined,
      });
      applyAuthSession(result.user, result.isNewUser);
      await mergeGuestCartIntoServer(queryClient);
      toast('Account created successfully', 'success');
      router.replace('/onboarding');
    } catch (err) {
      let msg = 'Signup failed';
      if (err instanceof SessionError) {
        if (err.status === 409) {
          msg = 'An account with this email already exists. Please log in instead.';
        } else {
          msg = err.message;
        }
      }
      toast(msg, 'error');
    }
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join JebDekho and shop from stores near you"
      footer={<AuthSwitchLink prompt="Already have an account?" linkText="Login" href="/login" />}
    >
      <AuthTabs
        tabs={[
          { id: 'mobile', label: 'Mobile Signup' },
          { id: 'email', label: 'Email Signup' },
        ]}
        active={tab}
        onChange={(next) => {
          setTab(next);
          setMobileStep('details');
          setOtp('');
          setOtpError(null);
        }}
      />

      {tab === 'mobile' && mobileStep === 'details' && (
        <form onSubmit={onMobileDetailsSubmit} className="space-y-5">
          <Input
            label="Name"
            placeholder="Your name"
            error={mobileForm.formState.errors.name?.message}
            {...mobileForm.register('name')}
          />
          <PhoneInput
            value={mobileForm.watch('phone')}
            onChange={(v) => mobileForm.setValue('phone', v, { shouldValidate: true })}
            error={mobileForm.formState.errors.phone?.message}
            disabled={requestOtp.isPending}
          />
          <Input
            label="Referral Code (optional)"
            placeholder="Enter referral code"
            {...mobileForm.register('referralCode')}
          />
          <Button type="submit" fullWidth loading={requestOtp.isPending}>
            Send OTP
          </Button>
        </form>
      )}

      {tab === 'mobile' && mobileStep === 'otp' && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-jd-text-muted">
              OTP sent to <span className="font-medium text-neutral-900">{phone}</span>
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-jd-primary hover:underline"
              onClick={() => {
                setMobileStep('details');
                setOtp('');
              }}
            >
              Change details
            </button>
          </div>

          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={verifyOtp.isPending}
            error={otpError ?? undefined}
          />

          <Button fullWidth loading={verifyOtp.isPending} onClick={onVerifyAndCreate}>
            Create Account
          </Button>

          <div className="text-center">
            {resendSeconds > 0 ? (
              <p className="text-xs text-jd-text-muted">Resend OTP in {resendSeconds}s</p>
            ) : (
              <button
                type="button"
                className="text-sm font-medium text-jd-primary hover:underline"
                onClick={async () => {
                  try {
                    const result = await requestOtp.mutateAsync({ phone });
                    setResendSeconds(result.expiresIn ?? 300);
                    toast('OTP resent', 'success');
                  } catch (err) {
                    const msg = err instanceof SessionError ? err.message : 'Failed to resend OTP';
                    toast(msg, 'error');
                  }
                }}
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
            label="Full Name"
            placeholder="Your full name"
            error={emailForm.formState.errors.name?.message}
            {...emailForm.register('name')}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={emailForm.formState.errors.password?.message}
            {...emailForm.register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            error={emailForm.formState.errors.confirmPassword?.message}
            {...emailForm.register('confirmPassword')}
          />
          <Input
            label="Referral Code (optional)"
            placeholder="Enter referral code"
            {...emailForm.register('referralCode')}
          />
          <Button type="submit" fullWidth loading={emailSignup.isPending}>
            Create Account
          </Button>
        </form>
      )}

      <div className="mt-6">
        <SocialLogin />
      </div>
    </AuthShell>
  );
}
