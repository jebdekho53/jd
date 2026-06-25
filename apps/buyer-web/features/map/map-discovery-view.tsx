'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';
import { StoreMap, StoreMapList } from '@/features/map/store-map';
import { fetchMapStores } from '@/services/geo/map-api';
import { useLocationStore } from '@/store/ui-store';

export function MapDiscoveryView() {
  const { lat, lng, label, setLocation } = useLocationStore();

  const { data: stores = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['map-stores', lat, lng],
    queryFn: () => fetchMapStores(lat, lng, 10),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude, 'Current location');
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-jd-text-primary">Map discovery</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-jd-text-muted">
              <MapPin className="h-4 w-4" />
              {label}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={detectLocation}>
              <Navigation className="mr-1 h-4 w-4" />
              Use GPS
            </Button>
            <Button type="button" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        ) : (
          <StoreMap buyerLat={lat} buyerLng={lng} stores={stores} />
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Nearby stores ({stores.length})
          </h2>
          {!isLoading && <StoreMapList stores={stores} />}
        </section>
      </div>
    </PageShell>
  );
}
