import { PageShell } from '@/components/layout/site-shell';
import { PdpSkeleton } from '@/features/products/pdp/components/pdp-skeleton';

export default function Loading() {
  return (
    <PageShell hideMobileNav hideFloatingCart className="!pt-0 md:!pt-6">
      <PdpSkeleton />
    </PageShell>
  );
}
