'use client';

import { LogOut } from 'lucide-react';
import { useLogoutMutation } from '@/hooks/use-auth';

export function Topbar({ title }: { title?: string }) {
  const { mutate: logout } = useLogoutMutation();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {title && <h1 className="text-base font-semibold text-slate-900">{title}</h1>}
      </div>
      <button
        type="button"
        onClick={() => logout(undefined, { onSettled: () => { window.location.href = '/login'; } })}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign out</span>
      </button>
    </header>
  );
}
