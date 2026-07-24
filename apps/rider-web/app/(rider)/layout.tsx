import { RiderSessionGuard } from '@/features/rider/rider-session-guard';
import { RiderBottomNav } from '@/design-system/bottom-nav';

/**
 * Every signed-in rider route lives under this group.
 *
 * The guard wraps `children` rather than sitting inside each page, so a page's
 * queries cannot fire before the session resolves. The bottom nav lives here
 * too — previously each page rendered its own copy.
 */
export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <RiderSessionGuard>
      <main className="mx-auto min-h-screen max-w-md bg-rider-bg pb-24 text-rider-text">
        {children}
      </main>
      <RiderBottomNav />
    </RiderSessionGuard>
  );
}
