'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  size?: 'sm' | 'md';
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1',
  md: 'h-9 px-3.5 text-sm gap-1.5',
} as const;

/** Filter / quick-action pill. Mobile-friendly tap target, horizontal-scroll ready. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, leadingIcon, trailingIcon, size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-medium transition tap-highlight-none btn-press',
        sizes[size],
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-soft'
          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted',
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  ),
);
Chip.displayName = 'Chip';
