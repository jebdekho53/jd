'use client';

import { cn } from '@/lib/cn';

export interface AuthTabItem<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
  badge?: string;
}

interface AuthTabsProps<T extends string> {
  tabs: AuthTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function AuthTabs<T extends string>({ tabs, active, onChange }: AuthTabsProps<T>) {
  return (
    <div className="mb-6 flex rounded-xl bg-neutral-100 p-1" role="tablist">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const isDisabled = Boolean(tab.disabled);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive && !isDisabled
                ? 'bg-white text-jd-primary shadow-sm'
                : isDisabled
                  ? 'cursor-not-allowed text-neutral-400'
                  : 'text-neutral-600 hover:text-neutral-900',
            )}
            onClick={() => {
              if (!isDisabled) onChange(tab.id);
            }}
          >
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Banner shown when mobile OTP is temporarily disabled. */
export function MobileOtpComingSoonBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900',
        className,
      )}
    >
      <p className="font-semibold">Mobile OTP coming soon</p>
      <p className="mt-1 text-amber-800">
        SMS verification will be available after provider approval. Please use email to continue.
      </p>
    </div>
  );
}
