'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button, PasswordInput, useToast } from '@/design-system';
import { useResetPasswordMutation } from '@/hooks/use-auth';

export function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const reset = useResetPasswordMutation();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    try {
      await reset.mutateAsync({ token, newPassword: password });
      toast('Password updated. Please sign in.', 'success');
      router.replace('/login');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">This reset link is invalid or expired.</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-admin-700 hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <h1 className="text-xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a strong new password for your admin account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="At least 8 characters"
            error={error}
          />
          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError('');
            }}
            placeholder="Repeat password"
          />
          <Button type="submit" fullWidth loading={reset.isPending}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
