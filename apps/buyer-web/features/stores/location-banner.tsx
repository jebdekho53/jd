'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationPickerModal } from '@/features/location/components/location-picker-modal';
import { useEffectiveLocation } from '@/store/location-store';

export function LocationBanner() {
  const { label, isReady } = useEffectiveLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm"
        role="region"
        aria-label="Delivery location"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Delivering to
            </p>
            <p className="truncate text-sm font-semibold">{label}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {isReady ? 'Change' : 'Set location'}
        </Button>
      </div>

      <LocationPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}
