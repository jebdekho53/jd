'use client';

import { Home, Briefcase, MapPin, MoreHorizontal } from 'lucide-react';
import type { ProfileAddress } from '@/features/profile/types';
import { cn } from '@/lib/utils';

const LABEL_ICONS = {
  Home: Home,
  Work: Briefcase,
  Other: MoreHorizontal,
} as const;

interface AddressCardProps {
  address: ProfileAddress;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  className?: string;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  className,
}: AddressCardProps) {
  const Icon = LABEL_ICONS[address.label as keyof typeof LABEL_ICONS] ?? MapPin;

  return (
    <article
      className={cn(
        'rounded-2xl border border-border/50 bg-card p-4 shadow-card',
        address.isDefault && 'ring-2 ring-primary/20',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-jd-text-primary">{address.label}</h3>
            {address.isDefault && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                Default
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-jd-text-secondary">{address.line1}</p>
          {address.line2 && (
            <p className="text-sm text-jd-text-muted">{address.line2}</p>
          )}
          {address.landmark && (
            <p className="text-xs text-jd-text-muted">Near {address.landmark}</p>
          )}
          <p className="mt-1 text-xs text-jd-text-muted">
            {address.city ? `${address.city}, ` : ''}
            PIN {address.pincode}
          </p>
          {(address.lat != null && address.lng != null) && (
            <p className="mt-1 text-[10px] text-jd-text-muted">
              Map: {address.lat.toFixed(4)}, {address.lng.toFixed(4)}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
          >
            Edit
          </button>
        )}
        {!address.isDefault && onSetDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-jd-text-secondary hover:bg-cream-3"
          >
            Set default
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
