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
  Tags,
  FolderTree,
  Bike,
  Banknote,
  Star,
  Tag,
  BarChart3,
  Radio,
  Headphones,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSessionQuery, useLogoutMutation } from '@/hooks/use-auth';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/control-room', label: 'Control Room', icon: Radio },
  { href: '/stores', label: 'Stores', icon: Store },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/promotions', label: 'Promotions', icon: Tag },
  { href: '/campaigns', label: 'Campaigns', icon: Tag },
  { href: '/rewards', label: 'Rewards & Wallet', icon: Tag },
  { href: '/categories', label: 'Categories', icon: FolderTree },
  { href: '/category-requests', label: 'Category Requests', icon: Tags },
  { href: '/inventory', label: 'Inventory', icon: Shield },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/orders/unassigned', label: 'Unassigned', icon: Bike },
  { href: '/fleet/live', label: 'Fleet Live', icon: Activity },
  { href: '/operations/map', label: 'Operations Map', icon: Activity },
  { href: '/riders/live', label: 'Riders Live', icon: Bike },
  { href: '/settlements', label: 'Settlements', icon: Banknote },
  { href: '/finance', label: 'Finance', icon: Banknote },
  { href: '/compliance', label: 'Compliance', icon: Shield },
  { href: '/trust-safety', label: 'Trust & Safety', icon: Shield },
  { href: '/support-center', label: 'Support Center', icon: Headphones },
  { href: '/crm', label: 'CRM & Growth', icon: BarChart3 },
  { href: '/merchant-success', label: 'Merchant Success', icon: Star },
  { href: '/fulfillment-network', label: 'Fulfillment Network', icon: Activity },
  { href: '/supply-chain', label: 'Supply Chain', icon: Package },
  { href: '/expansion', label: 'Expansion', icon: Radio },
  { href: '/ai-commerce', label: 'AI Commerce', icon: BarChart3 },
  { href: '/fleet', label: 'Fleet OS', icon: Bike },
  { href: '/ads', label: 'Ads', icon: Tag },
  { href: '/membership', label: 'Membership', icon: Star },
  { href: '/corporate', label: 'Corporate', icon: Users },
  { href: '/seo', label: 'SEO & GEO', icon: BarChart3 },
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
