import { merchantFetch } from '@/services/api/merchant-client';

export interface MerchantProfile {
  id: string;
  userId: string;
  businessName: string;
  gstNumber: string | null;
  panNumber: string | null;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertMerchantProfilePayload {
  businessName: string;
  /** Omitted when the merchant is not GST-registered — that is a valid state. */
  gstNumber?: string;
  panNumber: string;
}

export async function getMerchantProfile(): Promise<MerchantProfile> {
  const res = await merchantFetch<{ success: boolean; data: MerchantProfile }>(
    '/api/merchant/profile',
  );
  return res.data;
}

export async function createMerchantProfile(
  payload: UpsertMerchantProfilePayload,
): Promise<MerchantProfile> {
  const res = await merchantFetch<{ success: boolean; data: MerchantProfile }>(
    '/api/merchant/profile',
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function updateMerchantProfile(
  payload: Partial<UpsertMerchantProfilePayload>,
): Promise<MerchantProfile> {
  const res = await merchantFetch<{ success: boolean; data: MerchantProfile }>(
    '/api/merchant/profile',
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
  return res.data;
}
