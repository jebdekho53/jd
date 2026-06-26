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
  const res = await merchantFetch<{ success: boolean; data: MasterLocationResult[] }>(
    `/api/locations/pincodes/${pincode}`,
  );
  return res.data;
}
