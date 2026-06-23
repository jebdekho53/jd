'use client';

import { Menu } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';

export function Topbar({ title }: { title?: string }) {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      {title && <h1 className="text-base font-semibold text-slate-900">{title}</h1>}
    </header>
  );
}
