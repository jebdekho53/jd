import { useQuery } from '@tanstack/react-query';
import {
  getFlashSales,
  getFreeDeliveryDeals,
  getOffersNearYou,
  getTopDeals,
  getTrendingDeals,
} from '@/services/buyer-api';
import { useLocationStore } from '@/store/location-store';

export function useTopDealsQuery() {
  return useQuery({ queryKey: ['deals', 'top'], queryFn: () => getTopDeals(), staleTime: 60_000 });
}

export function useTrendingDealsQuery() {
  return useQuery({
    queryKey: ['deals', 'trending'],
    queryFn: () => getTrendingDeals(),
    staleTime: 60_000,
  });
}

export function useFreeDeliveryDealsQuery() {
  return useQuery({
    queryKey: ['deals', 'free-delivery'],
    queryFn: () => getFreeDeliveryDeals(),
    staleTime: 60_000,
  });
}

export function useFlashSalesQuery() {
  return useQuery({
    queryKey: ['offers', 'flash-sales'],
    queryFn: () => getFlashSales(),
    staleTime: 30_000,
  });
}

export function useOffersNearYouQuery() {
  const { lat, lng } = useLocationStore();
  return useQuery({
    queryKey: ['offers', 'near-you', lat, lng],
    queryFn: () => getOffersNearYou(lat!, lng!),
    enabled: lat != null && lng != null,
    staleTime: 30_000,
  });
}
