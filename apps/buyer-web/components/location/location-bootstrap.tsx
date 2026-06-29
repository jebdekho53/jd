'use client';

import { useEffect } from 'react';
import {
  isDeliveryAddressComplete,
  persistDeliveryAddress,
  restoreDeliveryLocationFromSavedAddress,
} from '@/lib/saved-delivery-address';
import { useCheckoutStore } from '@/store/checkout-store';
import { useLocationStore } from '@/store/location-store';

function restoreAfterHydration() {
  if (restoreDeliveryLocationFromSavedAddress()) return;

  const checkoutAddr = useCheckoutStore.getState().deliveryAddress;
  if (checkoutAddr && isDeliveryAddressComplete(checkoutAddr)) {
    persistDeliveryAddress(checkoutAddr);
  }
}

/** Keeps delivery location consistent across visits (Blinkit-style). */
export function LocationBootstrap() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const whenCheckoutReady = () => {
      restoreAfterHydration();
    };

    const whenLocationReady = () => {
      if (useCheckoutStore.persist.hasHydrated()) {
        whenCheckoutReady();
        return;
      }
      cleanups.push(useCheckoutStore.persist.onFinishHydration(whenCheckoutReady));
    };

    if (useLocationStore.persist.hasHydrated()) {
      whenLocationReady();
    } else {
      cleanups.push(useLocationStore.persist.onFinishHydration(whenLocationReady));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
