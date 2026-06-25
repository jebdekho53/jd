import { merchantFetch, buildQuery } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type { MerchantEarnings, PayoutRequestItem, SettlementLedgerItem } from '@/types/settlement';

export async function fetchMerchantEarnings(): Promise<MerchantEarnings> {
  const res = await merchantFetch<ApiResponse<MerchantEarnings>>('/api/merchant/earnings');
  return res.data;
}

export async function fetchMerchantSettlements(params: { page?: number; status?: string } = {}) {
  const res = await merchantFetch<
    ApiResponse<{ settlements: SettlementLedgerItem[]; meta: { page: number; limit: number; total: number; totalPages: number } }>
  >(`/api/merchant/settlements${buildQuery(params)}`);
  return res.data;
}

export async function createPayoutRequest(body: {
  amount: number;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName?: string;
}) {
  const res = await merchantFetch<ApiResponse<{ id: string; amount: number; status: string; requestedAt: string }>>(
    '/api/merchant/payout-request',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.data;
}

export async function fetchMerchantPayouts(params: { page?: number } = {}) {
  const res = await merchantFetch<
    ApiResponse<{ payouts: PayoutRequestItem[]; meta: { page: number; limit: number; total: number; totalPages: number } }>
  >(`/api/merchant/payouts${buildQuery(params)}`);
  return res.data;
}
