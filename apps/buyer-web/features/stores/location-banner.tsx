'use client';

import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/store/ui-store';

export function LocationBanner() {
  const { label } = useLocationStore();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Delivering to</p>
          <p className="truncate text-sm font-medium">{label}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" disabled title="Location picker coming in Sprint 2">
        Change
      </Button>
    </div>
  );
}
