'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  Activity,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSessionQuery, useLogoutMutation } from '@/hooks/use-auth';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/stores', label: 'Stores', icon: Store },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/monitoring', label: 'Monitoring', icon: Activity },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: user } = useSessionQuery();
  const { mutate: logout } = useLogoutMutation();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-slate-900 text-slate-100">
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Jebdekho</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-admin-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-xs font-medium text-slate-300">{user?.phone ?? '—'}</p>
          <p className="text-[10px] text-slate-500">{user?.roles.join(' · ')}</p>
        </div>
        <button
          type="button"
          onClick={() => logout(undefined, { onSettled: () => { window.location.href = '/login'; } })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
