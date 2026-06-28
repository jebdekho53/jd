'use client';

import { useMemo } from 'react';
import { useAddressStore } from '@/store/address-store';

/** Default delivery coordinates from saved addresses for compare / nearby APIs. */
export function useDeliveryLocation() {
  const addresses = useAddressStore((s) => s.addresses);

  return useMemo(() => {
    const addr = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (!addr) return { lat: undefined, lng: undefined, pincode: undefined };
    return {
      lat: addr.lat,
      lng: addr.lng,
      pincode: addr.pincode,
    };
  }, [addresses]);
}
