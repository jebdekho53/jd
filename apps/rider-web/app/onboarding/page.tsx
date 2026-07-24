'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '@/lib/api';
import { RiderSignup } from '@/features/auth/rider-signup';
import { KycUploadPanel } from '@/features/rider/kyc-upload-panel';

export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe, retry: false });

  if (me.isLoading) return <div className="grid min-h-screen place-items-center bg-rider-bg text-rider-muted">Loading...</div>;
  if (me.isError || !me.data) {
    router.replace('/login');
    return null;
  }

  // Step 1 of 2: not a rider yet — collect name, vehicle, and licence details.
  if (!me.data.isRider) {
    return (
      <RiderSignup
        phone={me.data.user.phone}
        onDone={() => {
          // Re-fetching flips isRider to true, which drops us straight into
          // step 2 below — no separate page, no chance to wander off to Home
          // and forget to come back and finish KYC.
          qc.invalidateQueries({ queryKey: ['rider', 'me'] });
        }}
        onSignOut={() => {
          qc.clear();
          router.replace('/login');
        }}
      />
    );
  }

  // Step 2 of 2: profile exists but KYC was never submitted — upload documents
  // right here instead of dropping the rider on Home and hoping they remember.
  if (me.data.profile?.kycStatus === 'PENDING') {
    return (
      <main className="min-h-screen bg-rider-bg px-4 py-8 text-rider-text">
        <div className="mx-auto w-full max-w-sm space-y-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-rider-accent">Step 2 of 2</p>
            <h1 className="mt-1 text-2xl font-black">Upload your documents</h1>
            <p className="mt-1 text-sm text-rider-muted">
              Submit these for compliance review before you can go online and start earning.
            </p>
          </div>
          <KycUploadPanel onSubmitted={() => router.replace('/onboarding/status')} />
        </div>
      </main>
    );
  }

  router.replace(me.data.profile?.kycStatus === 'APPROVED' ? '/home' : '/onboarding/status');
  return null;
}
