'use client';

import Link from 'next/link';
import { getSiteUrl } from '@jebdekho/web-config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/design-system/primitives';
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
}

export function MerchantEmailAuth({
  mode,
  onSuccess,
  heading,
  submitLabel,
  showForgotPassword = mode === 'login',
}: MerchantEmailAuthProps) {
  const { toast } = useToast();
  const emailLogin = useEmailLoginMutation();
  const emailSignup = useEmailSignupMutation();
  const pending = emailLogin.isPending || emailSignup.isPending;

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

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
      const result = await emailLogin.mutateAsync({ email: email.trim(), password });
      await onSuccess(result);
    } catch (err) {
      handleError(err);
    }
  });

  const onSignupSubmit = signupForm.handleSubmit(async ({ name, email, password }) => {
    try {
      const result = await emailSignup.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await onSuccess(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast('An account with this email already exists. Please log in instead.', 'error');
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
      <p className="text-center text-xs text-slate-500">
        Mobile OTP coming soon. Please use email to continue.
      </p>

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
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={loginForm.formState.errors.password?.message}
            {...loginForm.register('password')}
          />
          {showForgotPassword && (
            <p className="text-right text-sm">
              <Link href={`${getSiteUrl()}/forgot-password`} className="font-medium text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </p>
          )}
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
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={signupForm.formState.errors.password?.message}
            {...signupForm.register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            error={signupForm.formState.errors.confirmPassword?.message}
            {...signupForm.register('confirmPassword')}
          />
          <Button type="submit" fullWidth loading={pending}>
            {submitLabel ?? 'Create account'}
          </Button>
        </form>
      )}
    </div>
  );
}
