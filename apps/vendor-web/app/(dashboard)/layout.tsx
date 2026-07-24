import Link from 'next/link';
import { Package, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { BrandLockup } from '@/components/brand/brand-lockup';
import { requireVendorUser } from '@/lib/auth/session';
import { LogoutButton } from './logout-button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/catalog', label: 'Catalog', icon: Package },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Redirects to /login unless the user is signed in AND holds the VENDOR role.
  const user = await requireVendorUser();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-slate-800 bg-slate-900 p-4">
        <BrandLockup subtitle="Vendor" href="/dashboard" className="mb-6" />
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-800 pt-4">
          <p className="mb-2 truncate text-xs text-slate-400">{user.email ?? user.phone}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
