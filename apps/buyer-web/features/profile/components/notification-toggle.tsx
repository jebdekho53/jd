'use client';

import { cn } from '@/lib/utils';

interface NotificationToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function NotificationToggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-jd-text-primary">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-jd-text-muted">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
