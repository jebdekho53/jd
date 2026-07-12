'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSessionQuery, useLogoutMutation } from '@/hooks/use-auth';
import { useToast, Button } from '@/design-system/primitives';
import { MerchantAuthShell } from './components/merchant-auth-shell';
import { MerchantOtpFlow } from './components/merchant-otp-flow';
import { resolveMerchantEntryRoute } from '@/lib/merchant-entry-route';
import type { VerifyOtpResult } from '@/types/auth';

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: storedUser } = useAuthStore();
  const { data: session } = useSessionQuery(!!storedUser);
  const logout = useLogoutMutation();

  const notMerchantError = searchParams.get('error') === 'not_merchant';
  // When the merchant explicitly wants to switch accounts (?switch=1), never
  // auto-redirect them away from the login form.
  const forceSwitch = searchParams.get('switch') === '1';
  const activeUser = session ?? storedUser;

  const prefilledEmail = searchParams.get('email')?.trim() ?? '';
  const resolveNextPath = (computedPath: string) => {
    const next = searchParams.get('next');
    if (!next) return computedPath;
    if (computedPath === '/dashboard' && next.startsWith('/onboarding')) return computedPath;
    return next;
  };

  useEffect(() => {
    const u = session ?? storedUser;
    if (!u || forceSwitch) return;
    void (async () => {
      const { path } = await resolveMerchantEntryRoute(u);
      const next = searchParams.get('next');
      // Don't trap in-onboarding merchants on /login: only auto-redirect fully
      // onboarded merchants to the dashboard (or an explicit `next` target).
      // Otherwise leave the form visible so they can switch accounts.
      if (path === '/dashboard' || next) {
        router.replace(resolveNextPath(path));
      }
    })();
  }, [session, storedUser, router, searchParams, forceSwitch]);

  useEffect(() => {
    if (notMerchantError) {
      toast('This account is not registered as a merchant yet.', 'error');
    }
  }, [notMerchantError, toast]);

  const handleVerified = async (result: VerifyOtpResult) => {
    const { path, toast: entryToast } = await resolveMerchantEntryRoute(result.user);
    if (entryToast) toast(entryToast.message, entryToast.tone);
    router.replace(resolveNextPath(path));
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
      {activeUser && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-slate-700">
            You&apos;re signed in as <strong>{activeUser.email}</strong>.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const { path } = await resolveMerchantEntryRoute(activeUser);
                router.replace(resolveNextPath(path));
              }}
            >
              Continue
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, {
                  onSettled: () => toast('Signed out. Sign in with a different account.', 'info'),
                })
              }
            >
              Sign in with a different account
            </Button>
          </div>
        </div>
      )}

      <MerchantOtpFlow submitLabel="Verify & Sign in" onVerified={handleVerified} />
    </MerchantAuthShell>
  );
}
