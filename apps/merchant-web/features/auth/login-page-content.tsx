'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSessionQuery } from '@/hooks/use-auth';
import { useToast } from '@/design-system/primitives';
import { MerchantAuthShell } from './components/merchant-auth-shell';
import { MerchantEmailAuth } from './components/merchant-email-auth';
import { resolveMerchantEntryRoute } from '@/lib/merchant-entry-route';
import type { VerifyOtpResult } from '@/types/auth';

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: storedUser } = useAuthStore();
  const { data: session } = useSessionQuery(!!storedUser);

  const notMerchantError = searchParams.get('error') === 'not_merchant';

  const prefilledEmail = searchParams.get('email')?.trim() ?? '';

  useEffect(() => {
    const u = session ?? storedUser;
    if (!u) return;
    void (async () => {
      const { path } = await resolveMerchantEntryRoute(u);
      router.replace(searchParams.get('next') ?? path);
    })();
  }, [session, storedUser, router, searchParams]);

  useEffect(() => {
    if (notMerchantError) {
      toast('This account is not registered as a merchant yet.', 'error');
    }
  }, [notMerchantError, toast]);

  const handleVerified = async (result: VerifyOtpResult) => {
    const { path, toast: entryToast } = await resolveMerchantEntryRoute(result.user);
    if (entryToast) toast(entryToast.message, entryToast.tone);
    router.replace(searchParams.get('next') ?? path);
  };

  return (
    <MerchantAuthShell
      title="Merchant Login"
      subtitle="Sign in with your email and password"
      footer={
        <p className="text-slate-600">
          New to JebDekho?{' '}
          <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
            Start selling
          </Link>
        </p>
      }
    >
      <MerchantEmailAuth
        mode="login"
        submitLabel="Verify & Sign in"
        defaultEmail={prefilledEmail}
        onSuccess={handleVerified}
      />
    </MerchantAuthShell>
  );
}
