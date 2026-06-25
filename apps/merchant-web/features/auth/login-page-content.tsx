'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSessionQuery } from '@/hooks/use-auth';
import { useToast } from '@/design-system/primitives';
import { MerchantAuthShell } from './components/merchant-auth-shell';
import { MerchantOtpFlow } from './components/merchant-otp-flow';
import { fetchOnboardingStatus } from '@/services/onboarding/onboarding-api';
import type { VerifyOtpResult } from '@/types/auth';

async function resolvePostLoginRoute(user: VerifyOtpResult['user']): Promise<string> {
  if (user.roles.includes('MERCHANT')) return '/dashboard';
  try {
    const status = await fetchOnboardingStatus();
    if (status.hasApplication) return '/onboarding';
  } catch {
    /* not authenticated or no application */
  }
  return '/signup';
}

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: session } = useSessionQuery();
  const { user } = useAuthStore();

  const notMerchantError = searchParams.get('error') === 'not_merchant';

  useEffect(() => {
    const u = session ?? user;
    if (!u) return;
    void (async () => {
      const dest = await resolvePostLoginRoute(u);
      if (dest !== '/signup') router.replace(searchParams.get('next') ?? dest);
    })();
  }, [session, user, router, searchParams]);

  useEffect(() => {
    if (notMerchantError) {
      toast('This account is not registered as a merchant yet.', 'error');
    }
  }, [notMerchantError, toast]);

  const handleVerified = async (result: VerifyOtpResult) => {
    const dest = await resolvePostLoginRoute(result.user);
    if (dest === '/signup') {
      toast('No merchant account found. Continue signup to apply.', 'info');
      router.replace('/signup');
      return;
    }
    toast('Signed in successfully!', 'success');
    router.replace(searchParams.get('next') ?? dest);
  };

  return (
    <MerchantAuthShell
      title="Merchant Login"
      subtitle="Sign in with OTP to manage your store"
      footer={
        <p className="text-slate-600">
          New to JebDekho?{' '}
          <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
            Start selling
          </Link>
        </p>
      }
    >
      <MerchantOtpFlow
        heading="Sign in"
        submitLabel="Verify & Sign in"
        onVerified={handleVerified}
      />
    </MerchantAuthShell>
  );
}
