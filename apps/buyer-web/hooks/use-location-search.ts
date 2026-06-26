import { useQuery } from '@tanstack/react-query';
import { searchLocations } from '@/services/locations/location-api';

export function useLocationSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['locations', 'search', q],
    queryFn: () => searchLocations(q),
    enabled: q.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
