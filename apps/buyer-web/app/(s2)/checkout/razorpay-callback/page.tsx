import { Suspense } from 'react';
import { RazorpayCallbackContent } from '@/features/checkout/razorpay-callback-content';
import { PageShell } from '@/components/layout/site-shell';
import { Spinner } from '@/design-system/primitives';

export default function RazorpayCallbackPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </PageShell>
      }
    >
      <RazorpayCallbackContent />
    </Suspense>
  );
}
