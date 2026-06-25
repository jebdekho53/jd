import { merchantFetch } from '@/services/api/merchant-client';

export interface CityOption {
  id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
}

export interface ZoneOption {
  id: string;
  name: string;
  slug: string;
}

export async function listCities(): Promise<CityOption[]> {
  const res = await merchantFetch<{ success: boolean; data: CityOption[] }>('/api/geo/cities');
  return res.data;
}

export async function listZones(cityId: string): Promise<ZoneOption[]> {
  const res = await merchantFetch<{ success: boolean; data: ZoneOption[] }>(
    `/api/geo/cities/${cityId}/zones`,
  );
  return res.data;
}
