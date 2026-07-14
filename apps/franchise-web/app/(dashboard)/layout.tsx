import Link from 'next/link';
import { LayoutDashboard, Landmark, Map, ShieldCheck, Store, Users, TrendingUp, Wallet } from 'lucide-react';
import { requireFranchiseUser } from '@/lib/auth/session';
import { LogoutButton } from './logout-button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/territory', label: 'Territory', icon: Map },
  { href: '/stores', label: 'Stores', icon: Store },
  { href: '/riders', label: 'Riders', icon: Users },
  { href: '/growth', label: 'Growth', icon: TrendingUp },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/bank-account', label: 'Bank account', icon: Landmark },
  { href: '/kyc', label: 'Verification', icon: ShieldCheck },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Redirects to /login unless the user is signed in AND holds the FRANCHISE role.
  // (The old guard accepted any token and could be switched off entirely by an env
  // var, which would have exposed the whole portal to unauthenticated visitors.)
  const user = await requireFranchiseUser();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-slate-800 bg-slate-900 p-4">
        <p className="mb-6 text-sm font-semibold text-white">Jebdekho Franchise</p>
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
