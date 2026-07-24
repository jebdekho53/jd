'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleUserRound, Headphones, Home, IndianRupee, ListChecks } from 'lucide-react';

export type NavTab = 'home' | 'orders' | 'earnings' | 'support' | 'account';

const TABS: Array<{ key: NavTab; label: string; href: string; icon: typeof Home }> = [
  { key: 'home', label: 'Home', href: '/home', icon: Home },
  { key: 'orders', label: 'Orders', href: '/orders', icon: ListChecks },
  { key: 'earnings', label: 'Earnings', href: '/earnings', icon: IndianRupee },
  { key: 'support', label: 'Support', href: '/support', icon: Headphones },
  { key: 'account', label: 'Account', href: '/account', icon: CircleUserRound },
];

/** One nav, rendered once by `app/(rider)/layout.tsx`.
 *
 *  The active tab is derived from the pathname by prefix, so a sub-route keeps
 *  its parent tab lit — /orders/abc123 stays on Orders. `active` remains as an
 *  override for the rare screen whose URL does not match the tab it belongs to. */
export function RiderBottomNav({ active, badges }: { active?: NavTab; badges?: Partial<Record<NavTab, boolean>> }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-md grid-cols-5 border-t border-rider-border bg-rider-surface pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ key, label, href, icon: Icon }) => {
        const isActive = active
          ? active === key
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={key}
            href={href}
            className={`relative grid h-16 place-items-center text-xs font-bold transition ${
              isActive ? 'text-rider-accent' : 'text-rider-muted'
            }`}
          >
            <span className="grid justify-items-center gap-1">
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden />
                {badges?.[key] && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rider-danger" />
                )}
              </span>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
