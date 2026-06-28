import type { ReturnPolicySummary } from './return-policy';

export interface OrderClaimEligibility {
  orderId: string;
  deliveredAt: string | null;
  actions: {
    return: boolean;
    refund: boolean;
    replacement: boolean;
  };
  items: Array<{
    orderItemId: string;
    productId: string;
    productName: string;
    maxQuantity: number;
    policy: ReturnPolicySummary;
    claimTypes: string[];
    reasons: string[];
  }>;
}

export interface OrderClaim {
  id: string;
  claimNumber: string;
  claimType: string;
  status: string;
  reason: string;
  requestedAmount: number;
  createdAt: string;
}
