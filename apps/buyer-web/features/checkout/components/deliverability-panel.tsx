'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { checkDeliverability } from '@/services/geo/map-api';

interface DeliverabilityPanelProps {
  storeId: string;
  lat: number;
  lng: number;
  pincode?: string;
  onDeliverabilityChange?: (deliverable: boolean, loading: boolean) => void;
}

async function fetchDeliverability(storeId: string, lat: number, lng: number, pincode?: string) {
  const params = new URLSearchParams({
    storeId,
    lat: String(lat),
    lng: String(lng),
  });
  if (pincode) params.set('pincode', pincode);
  const res = await fetch(`/api/buyer/geo/deliverability?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to check delivery coverage');
  const json = await res.json();
  return json.data as Awaited<ReturnType<typeof checkDeliverability>>;
}

export function DeliverabilityPanel({
  storeId,
  lat,
  lng,
  pincode,
  onDeliverabilityChange,
}: DeliverabilityPanelProps) {
  const queryEnabled = Boolean(storeId && lat && lng);

  const { data, isLoading } = useQuery({
    queryKey: ['deliverability', storeId, lat, lng, pincode],
    queryFn: () => fetchDeliverability(storeId, lat, lng, pincode),
    enabled: queryEnabled,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!onDeliverabilityChange) return;
    if (!queryEnabled) {
      onDeliverabilityChange(false, false);
      return;
    }
    if (isLoading) {
      onDeliverabilityChange(false, true);
      return;
    }
    onDeliverabilityChange(data?.deliverable === true, false);
  }, [data?.deliverable, isLoading, onDeliverabilityChange, queryEnabled]);

  if (!queryEnabled || isLoading || !data || data.deliverable) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
      <div className="flex items-start gap-2 text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-2">
          <p className="font-medium">Not deliverable to this address</p>
          <p className="text-amber-800">
            {data.reason ?? 'This store does not deliver to your location.'}
            {data.distanceKm != null && ` (${data.distanceKm} km away, max ${data.deliveryRadiusKm} km).`}
          </p>
          {data.nearestStores.length > 0 && (
            <div>
              <p className="font-medium">Nearest available stores:</p>
              <ul className="mt-1 list-inside list-disc">
                {data.nearestStores.map((s) => (
                  <li key={s.id}>
                    <Link href={`/store/${s.slug}`} className="underline">
                      {s.name}
                    </Link>
                    {s.distanceKm != null && ` — ${s.distanceKm} km`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
