'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from '@/services/products/products-api';
import type { CreateProductPayload, ListProductsParams, UpdateProductPayload } from '@/types/product';
import { useSessionQuery } from '@/hooks/use-auth';

function merchantStoreKey(userId: string | undefined, storeId: string, ...parts: string[]) {
  return ['merchant', userId ?? 'anonymous', storeId, ...parts] as const;
}

export function useProductsQuery(storeId: string, params: ListProductsParams = {}) {
  const { data: user } = useSessionQuery();
  return useQuery({
    queryKey: merchantStoreKey(user?.id, storeId, 'products', JSON.stringify(params)),
    queryFn: () => listProducts(storeId, params),
    enabled: Boolean(storeId) && Boolean(user?.id),
  });
}

export function useProductQuery(storeId: string, productId: string) {
  const { data: user } = useSessionQuery();
  return useQuery({
    queryKey: merchantStoreKey(user?.id, storeId, 'products', productId),
    queryFn: () => getProduct(storeId, productId),
    enabled: Boolean(storeId) && Boolean(productId) && Boolean(user?.id),
  });
}

export function useCreateProductMutation(storeId: string) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(storeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merchant', user?.id ?? 'anonymous', storeId, 'products'] });
    },
  });
}

export function useUpdateProductMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(storeId, productId, payload),
    onSuccess: (product) => {
      qc.setQueryData(merchantStoreKey(user?.id, storeId, 'products', productId), product);
      qc.invalidateQueries({ queryKey: ['merchant', user?.id ?? 'anonymous', storeId, 'products'] });
    },
  });
}

export function useDeleteProductMutation(storeId: string) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(storeId, productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merchant', user?.id ?? 'anonymous', storeId, 'products'] });
    },
  });
}

export function useToggleProductStatusMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  return useMutation({
    mutationFn: (isActive: boolean) => toggleProductStatus(storeId, productId, isActive),
    onSuccess: (product) => {
      qc.setQueryData(merchantStoreKey(user?.id, storeId, 'products', productId), product);
      qc.invalidateQueries({ queryKey: ['merchant', user?.id ?? 'anonymous', storeId, 'products'] });
    },
  });
}
