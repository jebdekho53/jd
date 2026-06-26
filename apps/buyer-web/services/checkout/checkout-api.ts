import { buyerFetch } from '@/services/api/buyer-auth-client';
import type { ApiResponse } from '@/types/buyer';
import type {
  CheckoutResult,
  CodCheckoutResult,
  InitiateCheckoutPayload,
  RazorpayOrderResult,
  VerifyPaymentPayload,
  VerifyPaymentResult,
} from '@/types/checkout';

export async function initiateCheckout(
  payload: InitiateCheckoutPayload,
): Promise<CheckoutResult> {
  const res = await buyerFetch<ApiResponse<CheckoutResult>>('/api/buyer/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
  const data = res.data;
  return { ...data, id: data.id ?? data.checkoutId ?? '' };
}

export async function initiateCodCheckout(
  payload: InitiateCheckoutPayload,
): Promise<CodCheckoutResult> {
  const res = await buyerFetch<ApiResponse<CodCheckoutResult>>('/api/buyer/checkout/cod', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
  return res.data;
}

export async function getCheckoutStatus(checkoutId: string): Promise<CheckoutResult> {
  const res = await buyerFetch<ApiResponse<CheckoutResult>>(
    `/api/buyer/checkout/${checkoutId}`,
  );
  return res.data;
}

export async function createRazorpayOrder(checkoutId: string): Promise<RazorpayOrderResult> {
  const res = await buyerFetch<ApiResponse<RazorpayOrderResult>>(
    '/api/buyer/payments/create-order',
    {
      method: 'POST',
      body: JSON.stringify({ checkoutId }),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    },
  );
  return res.data;
}

export async function verifyRazorpayPayment(
  payload: VerifyPaymentPayload,
): Promise<VerifyPaymentResult> {
  const res = await buyerFetch<ApiResponse<VerifyPaymentResult>>(
    '/api/buyer/payments/verify',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    },
  );
  return res.data;
}
