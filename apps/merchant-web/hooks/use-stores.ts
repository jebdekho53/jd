'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listStores,
  getStore,
  createStore,
  updateStore,
  submitStoreForReview,
} from '@/services/stores/stores-api';
import type { CreateStorePayload, UpdateStorePayload } from '@/types/store';

export function useStoresQuery() {
  return useQuery({ queryKey: ['stores'], queryFn: () => listStores() });
}

export function useStoreQuery(id: string) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: () => getStore(id),
    enabled: Boolean(id),
  });
}

export function useCreateStoreMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStorePayload) => createStore(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stores'] }); },
  });
}

export function useUpdateStoreMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStorePayload) => updateStore(id, payload),
    onSuccess: (store) => {
      qc.setQueryData(['stores', id], store);
      qc.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useSubmitStoreForReviewMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => submitStoreForReview(id),
    onSuccess: (store) => {
      qc.setQueryData(['stores', id], store);
      qc.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}
