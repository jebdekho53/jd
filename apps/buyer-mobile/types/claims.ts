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
  autoApprovedByPlatform: boolean;
  createdAt: string;
}

export interface CreateOrderClaimInput {
  claimType: 'REFUND' | 'REPLACEMENT' | 'RETURN';
  reason: string;
  reasonNote?: string;
  items: Array<{ orderItemId: string; quantity: number }>;
  evidence?: Array<{ kind: 'PHOTO' | 'VIDEO'; url: string }>;
}
