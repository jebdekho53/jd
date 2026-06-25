import { apiGet } from '@/services/api/client';

export interface MapStorePin {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  ratingAvg: number;
  ratingCount: number;
  deliveryRadiusKm: number;
  locality: string | null;
  city: string;
  categories: string[];
  offer: { id: string; name: string; offerType: string } | null;
  etaMins: number | null;
}

export interface DeliverabilityResult {
  deliverable: boolean;
  distanceKm: number | null;
  deliveryRadiusKm: number;
  etaMins: number | null;
  reason?: string;
  nearestStores: Array<{
    id: string;
    name: string;
    slug: string;
    distanceKm: number | null;
    etaMins: number | null;
  }>;
}

export async function fetchMapStores(lat: number, lng: number, radiusKm = 10) {
  const res = await apiGet<{ success: boolean; data: MapStorePin[] }>('/buyer/map/stores', {
    lat,
    lng,
    radiusKm,
  });
  return res.data;
}

export async function checkDeliverability(storeId: string, lat: number, lng: number) {
  const res = await apiGet<{ success: boolean; data: DeliverabilityResult }>(
    '/buyer/geo/deliverability',
    { storeId, lat, lng },
  );
  return res.data;
}
