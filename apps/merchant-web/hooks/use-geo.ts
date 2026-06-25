import { useQuery } from '@tanstack/react-query';
import { listCities, listZones } from '@/services/geo/geo-api';

export function useCitiesQuery() {
  return useQuery({
    queryKey: ['geo', 'cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });
}

export function useZonesQuery(cityId: string) {
  return useQuery({
    queryKey: ['geo', 'zones', cityId],
    queryFn: () => listZones(cityId),
    enabled: Boolean(cityId),
    staleTime: 60 * 60 * 1000,
  });
}
