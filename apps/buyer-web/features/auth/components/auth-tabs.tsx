'use client';

import { cn } from '@/lib/cn';

interface AuthTabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}

export function AuthTabs<T extends string>({ tabs, active, onChange }: AuthTabsProps<T>) {
  return (
    <div className="mb-6 flex rounded-xl bg-neutral-100 p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={cn(
            'flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
            active === tab.id
              ? 'bg-white text-jd-primary shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900',
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
