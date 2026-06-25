'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, Input, useToast } from '@/design-system';
import { useForgotPasswordMutation } from '@/hooks/use-auth';

export function ForgotPasswordContent() {
  const { toast } = useToast();
  const forgot = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setError('');
    try {
      await forgot.mutateAsync(email.trim());
      setSent(true);
      toast('If an account exists, a reset link has been sent.', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

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

        <h1 className="text-xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your admin email. We&apos;ll send a reset link valid for 15 minutes.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Check your inbox for a password reset link. The link expires in 15 minutes and can only be used once.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="admin@jebdekho.com"
              error={error}
            />
            <Button type="submit" fullWidth loading={forgot.isPending}>
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
