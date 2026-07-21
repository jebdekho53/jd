'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BrandLockup } from '@/components/brand/brand-lockup';
import { useAuthStore } from '@/store/auth-store';
import { useStoreStore } from '@/store/store-store';
import { useLogoutMutation } from '@/hooks/use-auth';
import { useStoresQuery } from '@/hooks/use-stores';
import { useStoreCatalogKind } from '@/hooks/use-store-catalog-kind';
import { useApprovedMenuCategoriesQuery } from '@/hooks/use-categories-governance';
import { CommandPalette } from './command-palette';
import { baseNav, restaurantNav } from './nav-items';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { currentStore, setCurrentStore } = useStoreStore();
  const { mutate: logout } = useLogoutMutation();
  const { data: storeData } = useStoresQuery();

  const stores = storeData?.data ?? [];
  const { isMenuStore, isLoading: catalogLoading } = useStoreCatalogKind(currentStore?.id);
  // A store that sells both products and food (e.g. a bakery also stocking
  // packaged grocery) resolves to the PRODUCT catalog, so isMenuStore is false.
  // Any approved MENU category means the merchant needs the menu builder, so
  // surface the restaurant nav whenever menu access exists — alongside Products.
  const { data: approvedMenuCategories = [] } = useApprovedMenuCategoriesQuery(currentStore?.id);
  const hasMenuAccess = isMenuStore || approvedMenuCategories.length > 0;

  const filteredBaseNav = baseNav.filter((item) => {
    // Hide product-only nav only for pure menu stores; a mixed store keeps both.
    if (isMenuStore && (item.href === '/products' || item.href === '/inventory')) {
      return false;
    }
    return true;
  });

  const showRestaurantNav = Boolean(currentStore && hasMenuAccess && !catalogLoading);

  const nav = currentStore
    ? [
        ...filteredBaseNav.slice(0, 3),
        ...(showRestaurantNav ? restaurantNav(currentStore.id) : []),
        ...filteredBaseNav.slice(3),
      ]
    : baseNav;

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
      <div className="flex h-14 items-center border-b border-slate-100 px-4">
        <BrandLockup subtitle="Merchant" href="/dashboard" />
      </div>

      <div className="border-b border-slate-100 p-2">
        <CommandPalette items={nav} />
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
