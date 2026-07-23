'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isPhoneOtpEnabled } from '@jebdekho/web-config';
import { Button, Input, PasswordInput } from '@/design-system/primitives';
import {
  MerchantAgreementAcceptance,
  recordMerchantAgreementAcceptance,
} from '@/features/auth/components/merchant-agreement-acceptance';
import { useToast } from '@/design-system/primitives';
import { useEmailLoginMutation, useEmailSignupMutation } from '@/hooks/use-auth';
import { ApiError } from '@/services/api/merchant-client';
import type { VerifyOtpResult } from '@/types/auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Enter your name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export interface MerchantEmailAuthProps {
  mode: 'login' | 'signup';
  onSuccess: (result: VerifyOtpResult) => void | Promise<void>;
  heading?: string;
  submitLabel?: string;
  showForgotPassword?: boolean;
  defaultEmail?: string;
  onAccountExists?: (email: string) => void;
}

export function MerchantEmailAuth({
  mode,
  onSuccess,
  heading,
  submitLabel,
  showForgotPassword = mode === 'login',
  defaultEmail = '',
  onAccountExists,
}: MerchantEmailAuthProps) {
  const { toast } = useToast();
  const emailLogin = useEmailLoginMutation();
  const emailSignup = useEmailSignupMutation();
  const pending = emailLogin.isPending || emailSignup.isPending;
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);
  const [agreementError, setAgreementError] = useState<string | null>(null);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: '' },
  });

  useEffect(() => {
    if (defaultEmail) loginForm.setValue('email', defaultEmail);
  }, [defaultEmail, loginForm]);

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      toast(err.message, 'error');
      return;
    }
    toast(mode === 'login' ? 'Login failed' : 'Signup failed', 'error');
  };

  const onLoginSubmit = loginForm.handleSubmit(async ({ email, password }) => {
    try {
      const result = await emailLogin.mutateAsync({ email: email.trim(), password, rememberMe });
      await onSuccess(result);
    } catch (err) {
      handleError(err);
    }
  });

  const onSignupSubmit = signupForm.handleSubmit(async ({ name, email, password }) => {
    if (!acceptedAgreement) {
      setAgreementError('Please accept the Merchant Partner Agreement to continue');
      return;
    }
    setAgreementError(null);
    try {
      const result = await emailSignup.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await recordMerchantAgreementAcceptance();
      await onSuccess(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const email = signupForm.getValues('email').trim();
        toast(
          'This email is already registered. Sign in with your password to continue your application.',
          'error',
        );
        onAccountExists?.(email);
        return;
      }
      handleError(err);
    }
  });

  const title =
    heading ?? (mode === 'login' ? 'Sign in with email' : 'Create your merchant account');

  return (
    <div className="space-y-4">
      <h2 className="text-center text-sm font-semibold text-slate-700">{title}</h2>
      {/* Only advertise the OTP gap while phone OTP is actually off. Showing this
          unconditionally told merchants OTP login did not exist even when it did,
          stranding phone-registered merchants who have no email/password. */}
      {!isPhoneOtpEnabled() ? (
        <p className="text-center text-xs text-slate-500">
          Mobile OTP coming soon. Please use email to continue.
        </p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Registered with your mobile number? Use the <strong>Mobile OTP</strong> tab above.
        </p>
      )}

      {mode === 'login' ? (
        <form onSubmit={onLoginSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@store.com"
            error={loginForm.formState.errors.email?.message}
            {...loginForm.register('email')}
          />
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={loginForm.formState.errors.password?.message}
            {...loginForm.register('password')}
          />
          <div className="flex items-center justify-between text-sm py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-slate-600">Remember me</span>
            </label>
            {showForgotPassword && (
              // Must stay on THIS portal — getSiteUrl() resolves to the buyer site
              // for merchant-web, which sent merchants to jebdekho.com to reset.
              <Link href="/forgot-password" className="font-medium text-brand-600 hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <Button type="submit" fullWidth loading={pending}>
            {submitLabel ?? 'Sign in'}
          </Button>
        </form>
      ) : (
        <form onSubmit={onSignupSubmit} className="space-y-4">
          <Input
            label="Owner name"
            placeholder="Your full name"
            error={signupForm.formState.errors.name?.message}
            {...signupForm.register('name')}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@store.com"
            error={signupForm.formState.errors.email?.message}
            {...signupForm.register('email')}
          />
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={signupForm.formState.errors.password?.message}
            {...signupForm.register('password')}
          />
          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            error={signupForm.formState.errors.confirmPassword?.message}
            {...signupForm.register('confirmPassword')}
          />
          <MerchantAgreementAcceptance
            checked={acceptedAgreement}
            onChange={(v) => {
              setAcceptedAgreement(v);
              if (v) setAgreementError(null);
            }}
            error={agreementError}
          />
          <Button type="submit" fullWidth loading={pending}>
            {submitLabel ?? 'Create account'}
          </Button>
        </form>
      )}
    </div>
  );
}
