import { merchantFetch } from '@/services/api/merchant-client';

export interface MasterLocationResult {
  id: string;
  label: string;
  slug: string;
  type: 'pincode' | 'area' | 'city' | 'alias';
  pincode?: string;
  postOffice?: string;
  city: string;
  citySlug: string;
  area?: string;
  areaSlug?: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  deliveryRegion: string;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
}

interface GeocodedAddress {
  formattedAddress?: string;
  line1?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function searchLocations(q: string, limit = 15): Promise<MasterLocationResult[]> {
  const res = await merchantFetch<{ success: boolean; data: MasterLocationResult[] }>(
    `/api/locations/search${buildQuery({ q, limit })}`,
  );
  return res.data;
}

export async function lookupPincode(pincode: string): Promise<MasterLocationResult[]> {
  try {
    const res = await merchantFetch<{ success: boolean; data: MasterLocationResult[] }>(
      `/api/locations/pincodes/${pincode}`,
    );
    return res.data;
  } catch {
    const res = await merchantFetch<{ success: boolean; data: GeocodedAddress | null }>(
      `/api/geo/pincode${buildQuery({ pincode })}`,
    );
    if (!res.data?.pincode || !res.data.city || !res.data.state) return [];
    return [mapGeocodedPincode(res.data)];
  }
}

function mapGeocodedPincode(address: GeocodedAddress): MasterLocationResult {
  const pincode = address.pincode ?? '';
  const city = address.city ?? '';
  const state = address.state ?? '';
  const label = [address.locality || address.line1 || city || 'Selected location', city]
    .filter(Boolean)
    .join(', ');

  return {
    id: `manual-${pincode}`,
    label: `${label} — ${pincode}`,
    slug: `manual-${pincode}`,
    type: 'pincode',
    pincode,
    postOffice: address.locality || address.line1,
    city,
    citySlug: city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    area: address.locality || undefined,
    district: city,
    state,
    latitude: address.lat ?? 0,
    longitude: address.lng ?? 0,
    deliveryRegion: 'EXPANSION',
  };
}
