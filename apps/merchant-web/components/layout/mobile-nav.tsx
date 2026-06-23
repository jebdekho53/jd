'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { Sidebar } from './sidebar';

export function MobileNav() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    if (!sidebarOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (!sidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close menu"
      />
      <div className="relative z-50 flex h-full w-64">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}
