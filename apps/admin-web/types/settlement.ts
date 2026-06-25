export interface AdminSettlementsOverview {
  summary: {
    pendingPayouts: number;
    completedPayouts: number;
    totalMerchantLiability: number;
    availableLiability: number;
    pendingLiability: number;
    totalSettledToday: number;
    settlementsSettledToday: number;
  };
  merchantWallets: {
    merchantProfileId: string;
    businessName: string;
    availableBalance: number;
    pendingBalance: number;
    totalEarned: number;
    totalPaidOut: number;
  }[];
  settlementLedger: {
    id: string;
    orderNumber: string;
    merchant: string;
    netAmount: number;
    status: string;
    createdAt: string;
  }[];
}

export interface AdminPayoutRequest {
  id: string;
  merchant: string;
  merchantProfileId: string;
  gstNumber: string | null;
  amount: number;
  status: string;
  bankDetails: Record<string, unknown>;
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  processedAt: string | null;
  transaction: { id: string; status: string; referenceId: string | null } | null;
}
