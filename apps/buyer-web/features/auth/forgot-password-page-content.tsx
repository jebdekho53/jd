'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button, Input, PasswordInput } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthTabs, MobileOtpComingSoonBanner } from '@/features/auth/components/auth-tabs';
import { OtpInput } from '@/features/auth/components/otp-input';
import { PhoneInput } from '@/features/auth/components/phone-input';
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
  SessionError,
} from '@/hooks/use-auth';
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone';
import { isPhoneOtpEnabled } from '@jebdekho/web-config';

type ForgotTab = 'email' | 'mobile';
type MobileStep = 'phone' | 'reset';

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

const mobilePhoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a 10-digit mobile number')
    .refine(isValidIndianPhone, 'Enter a valid Indian mobile number'),
});

const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    code: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type MobilePhoneForm = z.infer<typeof mobilePhoneSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export function ForgotPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const tokenFromUrl = searchParams.get('token');
  const phoneOtpEnabled = isPhoneOtpEnabled();

  const [tab, setTab] = useState<ForgotTab>(
    tokenFromUrl ? 'email' : phoneOtpEnabled ? 'mobile' : 'email',
  );
  const [mobileStep, setMobileStep] = useState<MobileStep>(tokenFromUrl ? 'reset' : 'phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const forgotPassword = useForgotPasswordMutation();
  const resetPassword = useResetPasswordMutation();

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const mobilePhoneForm = useForm<MobilePhoneForm>({
    resolver: zodResolver(mobilePhoneSchema),
    defaultValues: { phone: '' },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '', code: '' },
  });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const onEmailSubmit = emailForm.handleSubmit(async ({ email }) => {
    try {
      await forgotPassword.mutateAsync({ email: email.trim() });
      setEmailSent(true);
      toast('Reset link sent if an account exists', 'success');
    } catch (err) {
      const msg = err instanceof SessionError ? err.message : 'Request failed';
      toast(msg, 'error');
    }
  });

  const onMobilePhoneSubmit = mobilePhoneForm.handleSubmit(async ({ phone: digits }) => {
    const e164 = normalizeIndianPhone(digits);
    setPhone(e164);
    try {
      const result = await forgotPassword.mutateAsync({ phone: e164 });
      setMobileStep('reset');
      setResendSeconds(result.expiresIn ?? 300);
      toast('OTP sent to your mobile', 'success');
    } catch (err) {
      const msg = err instanceof SessionError ? err.message : 'Request failed';
      toast(msg, 'error');
    }
  });

  const onResetSubmit = resetForm.handleSubmit(async (values) => {
    try {
      if (tokenFromUrl) {
        await resetPassword.mutateAsync({
          token: tokenFromUrl,
          newPassword: values.newPassword,
        });
      } else {
        const code = otp || values.code;
        if (!code || code.length < 6) {
          toast('Enter the complete OTP', 'error');
          return;
        }
        await resetPassword.mutateAsync({
          phone,
          code,
          newPassword: values.newPassword,
        });
      }
      toast('Password updated. Please log in.', 'success');
      router.replace('/login');
    } catch (err) {
      const msg = err instanceof SessionError ? err.message : 'Reset failed';
      toast(msg, 'error');
    }
  });

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll help you get back into your account"
      footer={
        <Link href="/login" className="text-sm font-semibold text-jd-primary hover:underline">
          Back to Login
        </Link>
      }
    >
      {!tokenFromUrl && (
        <AuthTabs
          tabs={[
            { id: 'email', label: 'Email' },
            {
              id: 'mobile',
              label: 'Mobile',
              disabled: !phoneOtpEnabled,
              badge: phoneOtpEnabled ? undefined : 'Coming Soon',
            },
          ]}
          active={tab}
          onChange={(next) => {
            setTab(next);
            setMobileStep('phone');
            setEmailSent(false);
          }}
        />
      )}

      {!phoneOtpEnabled && tab === 'mobile' && !tokenFromUrl && (
        <MobileOtpComingSoonBanner className="mb-5" />
      )}

      {tab === 'email' && !tokenFromUrl && !emailSent && (
        <form onSubmit={onEmailSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register('email')}
          />
          <Button type="submit" fullWidth loading={forgotPassword.isPending}>
            Send Reset Link
          </Button>
        </form>
      )}

      {tab === 'email' && emailSent && !tokenFromUrl && (
        <div className="rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-800">
          If an account exists for that email, we&apos;ve sent a reset link. Check your inbox.
        </div>
      )}

      {tab === 'mobile' && phoneOtpEnabled && mobileStep === 'phone' && !tokenFromUrl && (
        <form onSubmit={onMobilePhoneSubmit} className="space-y-5">
          <PhoneInput
            value={mobilePhoneForm.watch('phone')}
            onChange={(v) => mobilePhoneForm.setValue('phone', v, { shouldValidate: true })}
            error={mobilePhoneForm.formState.errors.phone?.message}
            disabled={forgotPassword.isPending}
          />
          <Button type="submit" fullWidth loading={forgotPassword.isPending}>
            Send OTP
          </Button>
        </form>
      )}

      {(mobileStep === 'reset' || tokenFromUrl) && (
        <form onSubmit={onResetSubmit} className="space-y-5">
          {!tokenFromUrl && (
            <>
              <p className="text-center text-sm text-jd-text-muted">
                Enter OTP sent to <span className="font-medium">{phone}</span>
              </p>
              <OtpInput value={otp} onChange={setOtp} disabled={resetPassword.isPending} />
            </>
          )}
          <PasswordInput
            label="New Password"
            autoComplete="new-password"
            error={resetForm.formState.errors.newPassword?.message}
            {...resetForm.register('newPassword')}
          />
          <PasswordInput
            label="Confirm Password"
            autoComplete="new-password"
            error={resetForm.formState.errors.confirmPassword?.message}
            {...resetForm.register('confirmPassword')}
          />
          <Button type="submit" fullWidth loading={resetPassword.isPending}>
            Reset Password
          </Button>
          {!tokenFromUrl && resendSeconds > 0 && (
            <p className="text-center text-xs text-jd-text-muted">Resend OTP in {resendSeconds}s</p>
          )}
        </form>
      )}
    </AuthShell>
  );
}
