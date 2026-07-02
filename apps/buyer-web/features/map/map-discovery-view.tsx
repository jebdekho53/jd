'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';
import { Chip } from '@/design-system/primitives';
import {
  StoreMap,
  StoreMapList,
  StoreMapPreviewSheet,
} from '@/features/map/store-map';
import { fetchMapStores } from '@/services/geo/map-api';
import type { MapStorePin } from '@/services/geo/map-api';
import { requestBrowserLocation } from '@/lib/geolocation';
import { useReverseGeocode } from '@/hooks/use-reverse-geocode';
import { useEffectiveLocation, useLocationStore } from '@/store/location-store';

export function MapDiscoveryView() {
  const { lat, lng, label, isReady, mapCenter } = useEffectiveLocation();
  const setFromGoogle = useLocationStore((s) => s.setFromGoogle);
  const { geocode, isLoading: isGeocoding } = useReverseGeocode();
  const [selected, setSelected] = useState<MapStorePin | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const browseLat = lat ?? mapCenter.lat;
  const browseLng = lng ?? mapCenter.lng;

  const { data: stores = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['map-stores', browseLat, browseLng],
    queryFn: () => fetchMapStores(browseLat, browseLng, 10),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: isReady,
  });

  const detectLocation = async () => {
    try {
      const pos = await requestBrowserLocation();
      const parsed = await geocode(pos.lat, pos.lng);
      if (parsed) {
        setFromGoogle({
          lat: parsed.lat,
          lng: parsed.lng,
          label: parsed.locality || parsed.formattedAddress,
          pincode: parsed.pincode || undefined,
          city: parsed.city,
          area: parsed.locality,
        });
        return;
      }
      useLocationStore.getState().setFromGps(pos.lat, pos.lng);
    } catch {
      /* ignore GPS errors */
    }
  };

  const openStore = (store: MapStorePin) => {
    setSelected(store);
    setSheetOpen(true);
  };

  return (
    <PageShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Stores on map</h1>
            {isReady && (
              <p className="mt-1 flex items-center gap-1 text-sm text-jd-text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {label}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Chip size="sm" leadingIcon={<Navigation className="h-3.5 w-3.5" aria-hidden />} onClick={() => void detectLocation()} disabled={isGeocoding}>
              GPS
            </Chip>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted md:h-80" />
        ) : (
          <StoreMap
            buyerLat={browseLat}
            buyerLng={browseLng}
            stores={stores}
            selectedStoreId={selected?.id ?? null}
            onSelectStore={openStore}
          />
        )}

        <p className="text-center text-xs text-jd-text-muted md:hidden">
          Tap a pin or store below for details
        </p>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-jd-text-primary">
            Nearby stores ({stores.length})
          </h2>
          {!isLoading && <StoreMapList stores={stores} onSelectStore={openStore} />}
        </section>
      </div>

      <StoreMapPreviewSheet
        store={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </PageShell>
  );
}
