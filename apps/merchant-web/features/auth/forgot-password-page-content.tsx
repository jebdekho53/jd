'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
import { Button, Input, PasswordInput, useToast } from '@/design-system/primitives';

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type EmailForm = z.infer<typeof emailSchema>;

const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ResetForm = z.infer<typeof resetSchema>;

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message ?? 'Something went wrong. Please try again.');
  }
  return json;
}

/**
 * Merchant password reset. Step 1: request a link by email (the API mails a link
 * back to THIS portal). Step 2: the link returns here with ?token= to set a new
 * password.
 */
export function ForgotPasswordPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const token = useSearchParams().get('token');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: '' } });
  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onRequest = emailForm.handleSubmit(async ({ email }) => {
    setPending(true);
    try {
      await post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setPending(false);
    }
  });

  const onReset = resetForm.handleSubmit(async ({ newPassword }) => {
    setPending(true);
    try {
      await post('/api/auth/reset-password', { token, newPassword });
      toast('Password updated. Please sign in.', 'success');
      router.push('/login');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setPending(false);
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {token ? (
          <>
            <h1 className="text-xl font-bold text-slate-900">Set a new password</h1>
            <p className="mt-1 text-sm text-slate-500">Choose a strong password for your merchant account.</p>
            <form onSubmit={onReset} className="mt-6 space-y-4">
              <PasswordInput
                label="New password"
                autoComplete="new-password"
                error={resetForm.formState.errors.newPassword?.message}
                {...resetForm.register('newPassword')}
              />
              <PasswordInput
                label="Confirm password"
                autoComplete="new-password"
                error={resetForm.formState.errors.confirmPassword?.message}
                {...resetForm.register('confirmPassword')}
              />
              <Button type="submit" fullWidth loading={pending}>
                Update password
              </Button>
            </form>
          </>
        ) : sent ? (
          <div className="text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
              <MailCheck className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
            <p className="mt-2 text-sm text-slate-500">
              If an account exists for that address, we&apos;ve sent a password reset link. It expires shortly — open it
              on this device to continue.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-sm font-medium text-brand-600 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900">Forgot password?</h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your merchant account email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={onRequest} className="mt-6 space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@yourstore.com"
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register('email')}
              />
              <Button type="submit" fullWidth loading={pending}>
                Send reset link
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
