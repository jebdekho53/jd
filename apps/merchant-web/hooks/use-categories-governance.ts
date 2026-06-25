'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCategoryCatalog,
  listApprovedCategories,
  listCategoryRequests,
  requestCategoryAccess,
} from '@/services/categories/categories-api';
import { useSessionQuery } from '@/hooks/use-auth';

function merchantStoreCategoryKey(
  userId: string | undefined,
  storeId: string | undefined,
  ...parts: string[]
) {
  return ['merchant', userId ?? 'anonymous', storeId ?? 'no-store', ...parts] as const;
}

export function useCategoryCatalogQuery(storeId: string | undefined) {
  const { data: user } = useSessionQuery();
  return useQuery({
    queryKey: merchantStoreCategoryKey(user?.id, storeId, 'category-catalog'),
    queryFn: () => getCategoryCatalog(storeId!),
    enabled: Boolean(user?.id) && Boolean(storeId),
  });
}

export function useCategoryRequestsQuery(storeId: string | undefined) {
  const { data: user } = useSessionQuery();
  return useQuery({
    queryKey: merchantStoreCategoryKey(user?.id, storeId, 'category-requests'),
    queryFn: () => listCategoryRequests(storeId!),
    enabled: Boolean(user?.id) && Boolean(storeId),
  });
}

export function useApprovedCategoriesQuery(storeId: string | undefined) {
  const { data: user } = useSessionQuery();
  return useQuery({
    queryKey: merchantStoreCategoryKey(user?.id, storeId, 'categories-approved'),
    queryFn: () => listApprovedCategories(storeId!),
    enabled: Boolean(user?.id) && Boolean(storeId),
    staleTime: 30_000,
  });
}

export function useRequestCategoryMutation(storeId: string | undefined) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  return useMutation({
    mutationFn: (payload: { categoryId: string; subcategoryId: string; reason?: string }) =>
      requestCategoryAccess(storeId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: merchantStoreCategoryKey(user?.id, storeId, 'category-requests'),
      });
      qc.invalidateQueries({
        queryKey: merchantStoreCategoryKey(user?.id, storeId, 'category-catalog'),
      });
      qc.invalidateQueries({
        queryKey: merchantStoreCategoryKey(user?.id, storeId, 'categories-approved'),
      });
    },
  });
}
