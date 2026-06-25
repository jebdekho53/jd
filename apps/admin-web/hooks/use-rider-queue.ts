'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listRiderQueue,
  listAvailableRiders,
  assignRider,
  autoAssignRider,
  reassignRider,
} from '@/services/admin-api';

export const riderQueueKeys = {
  all: ['admin', 'rider-queue'] as const,
  list: (page: number) => [...riderQueueKeys.all, page] as const,
  riders: (storeId: string) => ['admin', 'available-riders', storeId] as const,
};

export function useRiderQueueQuery(page = 1) {
  return useQuery({
    queryKey: riderQueueKeys.list(page),
    queryFn: () => listRiderQueue({ page, limit: 50 }),
    staleTime: 0,
    refetchInterval: 10_000,
  });
}

export function useAvailableRidersQuery(storeId: string | undefined) {
  return useQuery({
    queryKey: riderQueueKeys.riders(storeId ?? ''),
    queryFn: () => listAvailableRiders(storeId!),
    enabled: Boolean(storeId),
    staleTime: 30_000,
  });
}

export function useAssignRiderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderProfileId }: { orderId: string; riderProfileId: string }) =>
      assignRider(orderId, riderProfileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: riderQueueKeys.all });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useAutoAssignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => autoAssignRider(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: riderQueueKeys.all });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useReassignRiderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderProfileId }: { orderId: string; riderProfileId: string }) =>
      reassignRider(orderId, riderProfileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: riderQueueKeys.all });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}
