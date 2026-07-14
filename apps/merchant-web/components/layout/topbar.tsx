'use client';

import { Bell, Menu } from 'lucide-react';
import { useStoreStore } from '@/store/store-store';
import { useUIStore } from '@/store/ui-store';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { currentStore } = useStoreStore();
  const { setSidebarOpen } = useUIStore();

  return (
    <header className="flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-4 sm:px-4 lg:px-6">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>}
        {!title && currentStore && (
          <p className="truncate text-sm text-slate-500">{currentStore.name}</p>
        )}
      </div>

      <button
        type="button"
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
      </button>
    </header>
  );
}
