export interface MerchantProfile {
  id: string;
  userId: string;
  displayName: string;
  businessName: string | null;
  pan: string | null;
  gstin: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface CreateMerchantProfilePayload {
  displayName: string;
  businessName?: string;
  pan?: string;
  gstin?: string;
}
