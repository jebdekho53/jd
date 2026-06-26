import { apiGetClient } from '@/services/api/client';

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

interface SearchResponse {
  success: boolean;
  data: MasterLocationResult[];
}

export async function searchLocations(
  q: string,
  limit = 15,
): Promise<MasterLocationResult[]> {
  const res = await apiGetClient<SearchResponse>('/locations/search', { q, limit });
  return res.data;
}

export async function lookupPincode(pincode: string): Promise<MasterLocationResult[]> {
  const res = await apiGetClient<SearchResponse>(`/locations/pincodes/${pincode}`);
  return res.data;
}

export async function resolveLocationSlug(slug: string): Promise<MasterLocationResult> {
  const res = await apiGetClient<{ success: boolean; data: MasterLocationResult }>(
    `/locations/slugs/${slug}`,
  );
  return res.data;
}
