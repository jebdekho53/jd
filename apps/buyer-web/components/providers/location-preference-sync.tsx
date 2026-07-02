'use client';

import { useEffect } from 'react';
import { useAddressStore } from '@/store/address-store';
import { useLocationStore, useLocationHydrated } from '@/store/location-store';
import { useProfilePreferencesStore } from '@/store/profile-preferences-store';

/**
 * Makes the user's saved/preferred address authoritative for store discovery
 * and serviceability. When the location preference is "manual", the default
 * saved address drives the effective delivery location; when "auto", it only
 * seeds discovery if no location has been chosen yet (so GPS/manual picks are
 * never overridden). Renders nothing.
 */
export function LocationPreferenceSync() {
  const hydrated = useLocationHydrated();
  const preference = useProfilePreferencesStore((s) => s.settings.locationPreference);
  const addresses = useAddressStore((s) => s.addresses);
  const isReady = useLocationStore((s) => s.isReady);
  const lat = useLocationStore((s) => s.lat);
  const lng = useLocationStore((s) => s.lng);
  const setDefault = useLocationStore((s) => s.setDefault);

  useEffect(() => {
    if (!hydrated) return;
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (!def?.lat || !def?.lng) return;

    // Manual => saved default address is authoritative. Auto => only seed when
    // discovery has no location yet (don't override an explicit GPS/manual pick).
    const shouldApply = preference === 'manual' || !isReady;
    if (!shouldApply) return;
    if (lat === def.lat && lng === def.lng) return;

    setDefault(def.lat, def.lng, def.city ?? def.line1 ?? 'Saved address');
  }, [hydrated, preference, addresses, isReady, lat, lng, setDefault]);

  return null;
}
