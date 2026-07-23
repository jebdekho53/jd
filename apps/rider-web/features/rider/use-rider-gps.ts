'use client';

import { useEffect, useRef, useState } from 'react';
import { pushLocation } from '@/lib/api';

export type GpsState = 'idle' | 'watching' | 'denied' | 'unavailable' | 'weak';

/**
 * Streams the rider's position while they are online and approved.
 *
 * Fixes worse than 200 m are reported as a weak signal rather than sent — a bad
 * position is worse than none, because the assignment engine will route work to
 * it. Sends are throttled to one every 10 s to spare the battery on a phone
 * mounted on a bike all shift.
 */
export function useRiderGps({ online, approved }: { online: boolean; approved: boolean }) {
  const [state, setState] = useState<GpsState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!online || !approved || typeof navigator === 'undefined') return;
    if (!navigator.geolocation) {
      setState('unavailable');
      setMessage('GPS is not available on this device.');
      return;
    }

    let lastSent = 0;
    setState('watching');
    setMessage(null);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy > 200) {
          setState('weak');
          setMessage('GPS signal is weak. Move to an open area.');
          return;
        }
        const now = Date.now();
        if (now - lastSent < 10_000) return;
        lastSent = now;
        setState('watching');
        setMessage(null);
        void pushLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
          accuracy: pos.coords.accuracy,
        }).catch((err) => {
          setState('weak');
          setMessage(err instanceof Error ? err.message : 'Location update failed.');
        });
      },
      (err) => {
        setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
        setMessage(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setState('idle');
    };
  }, [approved, online]);

  return { state, message };
}
