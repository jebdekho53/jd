'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { Button } from './button';
import { Text } from './text';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
}

const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: ModalProps) {
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

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={dismissible ? onClose : undefined}
        tabIndex={-1}
      />
      <div
        className={cn(
          'relative z-10 w-full animate-s2-slide-up-lg rounded-t-2xl bg-white shadow-xl sm:rounded-2xl',
          widths[size],
          'max-h-[90vh] overflow-y-auto',
        )}
      >
        <div className="border-b border-neutral-100 px-6 py-5">
          <Text as="h2" variant="h2" id="modal-title">
            {title}
          </Text>
          {description && (
            <Text variant="bodySm" className="mt-2">
              {description}
            </Text>
          )}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="border-t border-neutral-100 px-6 py-4">{footer}</div>}
        {dismissible && !footer && (
          <div className="px-6 pb-6 sm:hidden">
            <Button variant="ghost" fullWidth onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
