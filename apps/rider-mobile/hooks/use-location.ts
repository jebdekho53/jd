import { useEffect } from 'react';
import { useRiderStore } from '@/store/rider-store';
import { startGpsTracking, stopGpsTracking, syncGpsWithAvailability } from '@/services/gps-service';

export function useGpsLifecycle() {
  const availability = useRiderStore((s) => s.availability);

  useEffect(() => {
    syncGpsWithAvailability();
    return () => stopGpsTracking();
  }, [availability]);
}

export function useLocationTracking(enabled = true) {
  const availability = useRiderStore((s) => s.availability);

  useEffect(() => {
    if (!enabled || availability === 'OFFLINE') {
      stopGpsTracking();
      return;
    }
    void startGpsTracking();
    return () => stopGpsTracking();
  }, [enabled, availability]);
}
