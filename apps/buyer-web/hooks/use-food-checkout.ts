'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createFoodRazorpayOrder,
  initiateFoodCheckout,
  initiateFoodCodCheckout,
  syncFoodPayment,
  verifyFoodPayment,
} from '@/services/food/food-api';
import { foodCartKeys } from '@/hooks/use-food-cart';
import { orderKeys } from '@/hooks/use-orders';
import type { FoodVerifyPaymentPayload, InitiateFoodCheckoutPayload } from '@/types/food';

export function useInitiateFoodCodCheckoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InitiateFoodCheckoutPayload) => initiateFoodCodCheckout(payload),
    onSuccess: () => {
      qc.setQueryData(foodCartKeys.current(), null);
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useInitiateFoodCheckoutMutation() {
  return useMutation({
    mutationFn: (payload: InitiateFoodCheckoutPayload) => initiateFoodCheckout(payload),
  });
}

export function useCreateFoodRazorpayOrderMutation() {
  return useMutation({
    mutationFn: (checkoutId: string) => createFoodRazorpayOrder(checkoutId),
  });
}

export function useVerifyFoodPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FoodVerifyPaymentPayload) => verifyFoodPayment(payload),
    onSuccess: () => {
      qc.setQueryData(foodCartKeys.current(), null);
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useSyncFoodPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (checkoutId: string) => syncFoodPayment(checkoutId),
    onSuccess: () => {
      qc.setQueryData(foodCartKeys.current(), null);
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
