'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInventory, updatePrice } from '@/services/products/products-api';
import type { UpdateInventoryPayload, UpdatePricePayload } from '@/types/product';

export function useUpdateInventoryMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, variantId }: { payload: UpdateInventoryPayload; variantId?: string }) =>
      updateInventory(storeId, productId, payload, variantId),
    onMutate: async ({ payload }) => {
      await qc.cancelQueries({ queryKey: ['products', storeId] });
      const prev = qc.getQueryData(['products', storeId, productId]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['products', storeId, productId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['products', storeId] });
    },
  });
}

export function useUpdatePriceMutation(storeId: string, productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, variantId }: { payload: UpdatePricePayload; variantId?: string }) =>
      updatePrice(storeId, productId, payload, variantId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', storeId] }); },
  });
}
