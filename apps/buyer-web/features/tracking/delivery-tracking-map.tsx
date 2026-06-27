'use client';

import { GoogleDeliveryMap, useGoogleMaps } from '@jebdekho/google-maps';
import { DeliveryMap } from './delivery-map';

interface DeliveryTrackingMapProps {
  store: { lat: number; lng: number };
  customer: { lat: number; lng: number };
  rider?: { lat: number; lng: number } | null;
  route?: Array<{ lat: number; lng: number }>;
  hasLiveProviderLocation?: boolean;
}

export function DeliveryTrackingMap({
  store,
  customer,
  rider,
  route,
  hasLiveProviderLocation,
}: DeliveryTrackingMapProps) {
  const { isConfigured, isLoaded } = useGoogleMaps();
  const showRider = rider && (hasLiveProviderLocation !== false || rider.lat != null);

  if (isConfigured && isLoaded) {
    return (
      <GoogleDeliveryMap
        store={store}
        customer={customer}
        rider={showRider ? rider : null}
        route={route}
      />
    );
  }

  return (
    <DeliveryMap
      store={{ ...store, label: 'Store' }}
      customer={{ ...customer, label: 'You' }}
      rider={showRider ? { ...rider!, label: 'Partner' } : null}
      route={route}
    />
  );
}
