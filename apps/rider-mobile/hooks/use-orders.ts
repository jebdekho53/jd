import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listRiderOrders } from '@/services/rider-api';
import { useDeliveryStore } from '@/store/delivery-store';
import { useEffect } from 'react';

export const ORDERS_KEY = ['rider', 'orders'] as const;
export const orderDetailKey = (id: string) => ['rider', 'orders', id] as const;

export function useOrdersQuery() {
  const syncFromList = useDeliveryStore((s) => s.syncFromList);

  const query = useQuery({
    queryKey: ORDERS_KEY,
    queryFn: listRiderOrders,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!query.data) return;
    syncFromList(query.data);
  }, [query.data, syncFromList]);

  return query;
}

export function useInvalidateOrders() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ORDERS_KEY });
}
