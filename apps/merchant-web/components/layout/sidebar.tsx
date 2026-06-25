'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
  Package,
  Layers,
  ShoppingBag,
  LogOut,
  Tags,
  Wallet,
  Monitor,
  Star,
  Tag,
  Headphones,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/auth-store';
import { useStoreStore } from '@/store/store-store';
import { useLogoutMutation } from '@/hooks/use-auth';
import { useStoresQuery } from '@/hooks/use-stores';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stores', label: 'My Stores', icon: Store },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: Layers },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/orders/live', label: 'Live Orders', icon: Monitor },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/promotions', label: 'Promotions', icon: Tag },
  { href: '/earnings', label: 'Earnings', icon: Wallet },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/gst', label: 'GST & Tax', icon: Wallet },
  { href: '/support', label: 'Support', icon: Headphones },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/growth', label: 'Growth', icon: Star },
  { href: '/ai', label: 'AI Commerce', icon: Star },
  { href: '/network', label: 'Network', icon: Layers },
  { href: '/procurement', label: 'Procurement', icon: Package },
  { href: '/ads', label: 'Ads', icon: Tag },
  { href: '/seo', label: 'SEO', icon: Tag },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { currentStore, setCurrentStore } = useStoreStore();
  const { mutate: logout } = useLogoutMutation();
  const { data: storeData } = useStoresQuery();

  const stores = storeData?.data ?? [];

  useEffect(() => {
    if (stores.length === 0) {
      if (currentStore) setCurrentStore(null);
      return;
    }
    const owned = currentStore && stores.some((s) => s.id === currentStore.id);
    if (!owned) {
      setCurrentStore(stores[0] ?? null);
    }
  }, [stores, currentStore, setCurrentStore]);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
          JD
        </div>
        <span className="text-sm font-semibold text-slate-900">Merchant</span>
      </div>

      {stores.length > 0 && (
        <div className="border-b border-slate-100 p-3">
          <label className="mb-1 block text-xs font-medium text-slate-500">Active Store</label>
          <select
            value={currentStore?.id ?? ''}
            onChange={(e) => {
              const s = stores.find((st) => st.id === e.target.value);
              setCurrentStore(s ?? null);
            }}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            {!currentStore && <option value="">Select store…</option>}
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {user?.phone.slice(-2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700">{user?.phone}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
