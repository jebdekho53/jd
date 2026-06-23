'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  toggleProductStatus,
} from '@/services/products/products-api';
import type { CreateProductPayload, ListProductsParams, UpdateProductPayload } from '@/types/product';

export function useProductsQuery(storeId: string, params: ListProductsParams = {}) {
  return useQuery({
    queryKey: ['products', storeId, params],
    queryFn: () => listProducts(storeId, params),
    enabled: Boolean(storeId),
  });
}

export function useProductQuery(storeId: string, productId: string) {
  return useQuery({
    queryKey: ['products', storeId, productId],
    queryFn: () => getProduct(storeId, productId),
    enabled: Boolean(storeId) && Boolean(productId),
  });
}

export function useCategoriesQuery(storeId: string) {
  return useQuery({
    queryKey: ['categories', storeId],
    queryFn: () => listCategories(storeId),
    enabled: Boolean(storeId),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateProductMutation(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(storeId, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', storeId] }); },
  });
}

export function useUpdateProductMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(storeId, productId, payload),
    onSuccess: (product) => {
      qc.setQueryData(['products', storeId, productId], product);
      qc.invalidateQueries({ queryKey: ['products', storeId] });
    },
  });
}

export function useDeleteProductMutation(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(storeId, productId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', storeId] }); },
  });
}

export function useToggleProductStatusMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) => toggleProductStatus(storeId, productId, isActive),
    onSuccess: (product) => {
      qc.setQueryData(['products', storeId, productId], product);
      qc.invalidateQueries({ queryKey: ['products', storeId] });
    },
  });
}
