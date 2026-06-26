'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Show the grab handle at the top (default true). */
  showHandle?: boolean;
  /** Allow dismiss on overlay click / Escape (default true). */
  dismissible?: boolean;
  /** Max height of the sheet content area. */
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const sizeClasses: Record<NonNullable<BottomSheetProps['size']>, string> = {
  sm: 'max-h-[50vh]',
  md: 'max-h-[75vh]',
  lg: 'max-h-[90vh]',
  full: 'h-[100dvh] rounded-none',
};

/**
 * Mobile-first bottom sheet. On `sm+` it gracefully centers as a dialog so it
 * also works on desktop without separate code paths.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  showHandle = true,
  dismissible = true,
  size = 'md',
  className,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, dismissible]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Dialog'}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={dismissible ? onClose : undefined}
        className="absolute inset-0 animate-overlay-in bg-neutral-950/50 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden bg-card text-card-foreground shadow-sheet',
          'animate-sheet-up rounded-t-3xl sm:max-w-md sm:animate-scale-in sm:rounded-3xl',
          sizeClasses[size],
          className,
        )}
      >
        {showHandle && (
          <div className="flex shrink-0 justify-center pt-3 sm:hidden">
            <span className="h-1.5 w-10 rounded-full bg-border" aria-hidden />
          </div>
        )}

        {(title || dismissible) && (
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-3">
            <div className="min-w-0">
              {title && (
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-border bg-card px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
        {!footer && <div className="h-safe-bottom shrink-0" aria-hidden />}
      </div>
    </div>,
    document.body,
  );
}
