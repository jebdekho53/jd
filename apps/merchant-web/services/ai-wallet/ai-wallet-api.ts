import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';

export interface AiWalletSummary {
  balancePaise: number;
  balanceRupee: number;
  minimumRechargePaise: number;
  minimumRechargeRupee: number;
  aiProductCostPaise: number;
  aiProductCostRupee: number;
  totalSpentPaise: number;
  totalRechargedPaise: number;
  totalRefundedPaise: number;
  transactions: {
    id: string;
    type: string;
    status: string;
    amountPaise: number;
    amountRupee: number;
    reason: string | null;
    productName: string | null;
    createdAt: string;
  }[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AiWalletRechargeOrder {
  transactionId: string;
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
  amountPaise: number;
}

export async function getAiWallet(page = 1): Promise<AiWalletSummary> {
  const res = await merchantFetch<ApiResponse<AiWalletSummary>>(
    `/api/merchant/ai-wallet?page=${page}`,
  );
  return res.data;
}

export async function createAiWalletRechargeOrder(amountPaise: number): Promise<AiWalletRechargeOrder> {
  const res = await merchantFetch<ApiResponse<AiWalletRechargeOrder>>(
    '/api/merchant/ai-wallet/recharge/create-order',
    {
      method: 'POST',
      body: JSON.stringify({ amountPaise }),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    },
  );
  return res.data;
}

export async function verifyAiWalletRecharge(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ balancePaise: number; success: boolean }> {
  const res = await merchantFetch<ApiResponse<{ balancePaise: number; success: boolean }>>(
    '/api/merchant/ai-wallet/recharge/verify',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    },
  );
  return res.data;
}
