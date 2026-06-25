export interface MerchantWallet {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalPaidOut: number;
}

export interface MerchantEarnings {
  wallet: MerchantWallet;
  commissionBreakdown: {
    totalGross: number;
    totalCommission: number;
    totalNet: number;
  };
  recentOrdersRevenue: {
    orderId: string;
    orderNumber: string;
    orderTotal: number;
    grossAmount: number;
    netAmount: number;
    createdAt: string;
  }[];
  settlementHistory: {
    id: string;
    orderId: string;
    orderNumber: string;
    grossAmount: number;
    platformCommission: number;
    netAmount: number;
    status: string;
    createdAt: string;
  }[];
  openPayoutRequest: {
    id: string;
    amount: number;
    status: string;
    requestedAt: string;
  } | null;
}

export interface SettlementLedgerItem {
  id: string;
  orderId: string;
  orderNumber: string;
  grossAmount: number;
  deliveryFee: number;
  platformCommission: number;
  taxAmount: number;
  netAmount: number;
  commissionPercent: number;
  status: string;
  eligibleAt: string;
  settledAt: string | null;
  createdAt: string;
}

export interface PayoutRequestItem {
  id: string;
  amount: number;
  status: string;
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  processedAt: string | null;
  transaction: { id: string; status: string; referenceId: string | null } | null;
}
