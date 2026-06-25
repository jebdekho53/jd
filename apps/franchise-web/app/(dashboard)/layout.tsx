import Link from 'next/link';
import { LayoutDashboard, Map, Store, Users, TrendingUp, Wallet } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/territory', label: 'Territory', icon: Map },
  { href: '/stores', label: 'Stores', icon: Store },
  { href: '/riders', label: 'Riders', icon: Users },
  { href: '/growth', label: 'Growth', icon: TrendingUp },
  { href: '/finance', label: 'Finance', icon: Wallet },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-slate-800 bg-slate-900 p-4">
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
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
