import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CheckoutStep, DeliveryAddress, PaymentMethod } from '@/types/checkout';

interface CheckoutState {
  step: CheckoutStep;
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress | null;
  buyerNote: string;
  walletAmountToUse: number;
  rewardPointsToRedeem: number;
  /** checkoutId from POST /checkout (online payment flow) */
  checkoutId: string | null;
  /** Final orderId after successful payment or COD */
  confirmedOrderId: string | null;
  confirmedOrderNumber: string | null;

  setStep: (step: CheckoutStep) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDeliveryAddress: (address: DeliveryAddress) => void;
  setBuyerNote: (note: string) => void;
  setWalletAmountToUse: (amount: number) => void;
  setRewardPointsToRedeem: (points: number) => void;
  setCheckoutId: (id: string | null) => void;
  setConfirmed: (orderId: string, orderNumber: string) => void;
  reset: () => void;
}

const INITIAL: Omit<
  CheckoutState,
  | 'setStep'
  | 'setPaymentMethod'
  | 'setDeliveryAddress'
  | 'setBuyerNote'
  | 'setWalletAmountToUse'
  | 'setRewardPointsToRedeem'
  | 'setCheckoutId'
  | 'setConfirmed'
  | 'reset'
> = {
  step: 'address',
  paymentMethod: 'COD',
  deliveryAddress: null,
  buyerNote: '',
  walletAmountToUse: 0,
  rewardPointsToRedeem: 0,
  checkoutId: null,
  confirmedOrderId: null,
  confirmedOrderNumber: null,
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      setStep: (step) => set({ step }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
      setBuyerNote: (buyerNote) => set({ buyerNote }),
      setWalletAmountToUse: (walletAmountToUse) => set({ walletAmountToUse }),
      setRewardPointsToRedeem: (rewardPointsToRedeem) => set({ rewardPointsToRedeem }),
      setCheckoutId: (checkoutId) => set({ checkoutId }),
      setConfirmed: (confirmedOrderId, confirmedOrderNumber) =>
        set({ confirmedOrderId, confirmedOrderNumber, step: 'done' }),
      reset: () =>
        set({
          ...INITIAL,
          deliveryAddress: get().deliveryAddress,
          paymentMethod: get().paymentMethod,
        }),
    }),
    {
      name: 'jebdekho-checkout-v1',
      partialize: (s) => ({
        deliveryAddress: s.deliveryAddress,
        paymentMethod: s.paymentMethod,
        buyerNote: s.buyerNote,
      }),
    },
  ),
);
