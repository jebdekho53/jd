'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOfflineBill,
  listOfflineBills,
  listOfflineBillCustomers,
} from '@/services/billing/billing-api';
import type { CreateOfflineBillPayload } from '@/types/billing';
import { useSessionQuery } from '@/hooks/use-auth';

function billingKey(userId: string | undefined, storeId: string, ...parts: string[]) {
  return ['merchant', userId ?? 'anonymous', storeId, 'offline-bills', ...parts] as const;
}

export function useOfflineBillsQuery(storeId: string, params: { page?: number; customerPhone?: string } = {}) {
  const { data: user } = useSessionQuery();
  return useQuery({
    queryKey: billingKey(user?.id, storeId, 'list', JSON.stringify(params)),
    queryFn: () => listOfflineBills(storeId, params),
    enabled: Boolean(storeId) && Boolean(user?.id),
  });
}

export function useOfflineBillCustomersQuery(storeId: string) {
  const { data: user } = useSessionQuery();
  return useQuery({
    queryKey: billingKey(user?.id, storeId, 'customers'),
    queryFn: () => listOfflineBillCustomers(storeId),
    enabled: Boolean(storeId) && Boolean(user?.id),
  });
}

export function useCreateOfflineBillMutation(storeId: string) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  return useMutation({
    mutationFn: (payload: CreateOfflineBillPayload) => createOfflineBill(storeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merchant', user?.id ?? 'anonymous', storeId, 'offline-bills'] });
      qc.invalidateQueries({ queryKey: ['merchant', user?.id ?? 'anonymous', storeId, 'products'] });
      qc.invalidateQueries({ queryKey: ['products', storeId] });
    },
  });
}
