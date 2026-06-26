import { useQuery } from '@tanstack/react-query';
import { lookupPincode, searchLocations } from '@/services/locations/location-api';

export function useLocationSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['locations', 'search', q],
    queryFn: () => searchLocations(q),
    enabled: q.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePincodeLookup(pincode: string) {
  const valid = /^\d{6}$/.test(pincode);
  return useQuery({
    queryKey: ['locations', 'pincode', pincode],
    queryFn: () => lookupPincode(pincode),
    enabled: valid,
    staleTime: 10 * 60 * 1000,
  });
}
