'use client';

import { Menu, Bell } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useStoreStore } from '@/store/store-store';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { toggleSidebar } = useUIStore();
  const { currentStore } = useStoreStore();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        {title && <h1 className="text-base font-semibold text-slate-900">{title}</h1>}
        {!title && currentStore && (
          <p className="text-sm text-slate-500">{currentStore.name}</p>
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
