'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ActionBarProps {
  children: ReactNode;
  className?: string;
  /**
   * `aboveNav` floats the bar above the mobile bottom navigation (use on pages
   * that keep the nav, e.g. PDP). `flush` pins it to the viewport bottom (use on
   * pages that hide the nav, e.g. cart/checkout).
   */
  position?: 'aboveNav' | 'flush';
  /** Hide on desktop where a sticky sidebar summary is used instead. */
  mobileOnly?: boolean;
}

/**
 * Fixed bottom action bar for primary mobile CTAs (add to cart, checkout, pay).
 * Pages should add matching bottom padding so content isn't obscured.
 */
export function ActionBar({
  children,
  className,
  position = 'flush',
  mobileOnly = true,
}: ActionBarProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md',
        'px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
        position === 'aboveNav'
          ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0'
          : 'bottom-0',
        mobileOnly && 'md:hidden',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3">{children}</div>
    </div>
  );
}
