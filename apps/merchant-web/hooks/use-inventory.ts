'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInventory, updatePrice, recordOfflineSale } from '@/services/products/products-api';
import type { UpdateInventoryPayload, UpdatePricePayload, RecordOfflineSalePayload } from '@/types/product';
import { useSessionQuery } from '@/hooks/use-auth';
import { merchantStoreKey } from '@/hooks/use-products';

export function useUpdateInventoryMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  const productsKey = merchantStoreKey(user?.id, storeId, 'products');
  const productKey = merchantStoreKey(user?.id, storeId, 'products', productId);

  return useMutation({
    mutationFn: ({ payload, variantId }: { payload: UpdateInventoryPayload; variantId?: string }) =>
      updateInventory(storeId, productId, payload, variantId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: productsKey });
      const prev = qc.getQueryData(productKey);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(productKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: productsKey });
    },
  });
}

export function useRecordOfflineSaleMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  return useMutation({
    mutationFn: ({ payload, variantId }: { payload: RecordOfflineSalePayload; variantId?: string }) =>
      recordOfflineSale(storeId, productId, payload, variantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: merchantStoreKey(user?.id, storeId, 'products') });
    },
  });
}

export function useUpdatePriceMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  const { data: user } = useSessionQuery();
  return useMutation({
    mutationFn: ({ payload, variantId }: { payload: UpdatePricePayload; variantId?: string }) =>
      updatePrice(storeId, productId, payload, variantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: merchantStoreKey(user?.id, storeId, 'products') });
    },
  });
}
