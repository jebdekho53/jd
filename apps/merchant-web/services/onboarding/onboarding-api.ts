import { merchantFetch } from '@/services/api/merchant-client';

export interface OnboardingStats {
  activeCustomers: number;
  ordersDelivered: number;
  citiesServed: number;
  merchantPartners: number;
}

export interface MerchantApplication {
  id: string;
  status: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  gstNumber?: string | null;
  gstVerified?: boolean;
  panNumber?: string | null;
  storeName?: string | null;
  storeAddress?: string | null;
  state?: string | null;
  city?: string | null;
  cityId?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadiusKm?: number | null;
  storeLogoUrl?: string | null;
  storeBannerUrl?: string | null;
  documents?: Array<{ documentType: string; fileName: string; fileUrl: string }>;
  bankAccount?: {
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
  } | null;
  steps?: Array<{ stepKey: string; completed: boolean }>;
}

export async function fetchOnboardingStats(): Promise<OnboardingStats> {
  const res = await fetch('/api/merchant/onboarding/stats', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load stats');
  const body = await res.json();
  return (body.data ?? body) as OnboardingStats;
}

export async function fetchApplication(): Promise<MerchantApplication> {
  const res = await merchantFetch<{ data: MerchantApplication }>('/api/merchant/onboarding/application');
  return res.data;
}

export async function updateOnboardingStep(
  body: Record<string, unknown>,
): Promise<MerchantApplication> {
  const res = await merchantFetch<{ data: MerchantApplication }>(
    '/api/merchant/onboarding/application',
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  return res.data;
}

export async function uploadOnboardingDocument(body: {
  documentType: string;
  fileName: string;
  mimeType: string;
  fileUrl: string;
}): Promise<MerchantApplication> {
  const res = await merchantFetch<{ data: MerchantApplication }>(
    '/api/merchant/onboarding/application/documents',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.data;
}

export async function saveBankAccount(body: {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
}): Promise<MerchantApplication> {
  const res = await merchantFetch<{ data: MerchantApplication }>(
    '/api/merchant/onboarding/application/bank',
    { method: 'POST', body: JSON.stringify(body) },
  );
  return res.data;
}

export async function validateGst(gstNumber: string) {
  const res = await merchantFetch<{ data: { valid: boolean; message: string } }>(
    '/api/merchant/onboarding/application/validate-gst',
    { method: 'POST', body: JSON.stringify({ gstNumber }) },
  );
  return res.data;
}

export async function submitApplication(): Promise<MerchantApplication> {
  const res = await merchantFetch<{ data: MerchantApplication }>(
    '/api/merchant/onboarding/application/submit',
    { method: 'POST' },
  );
  return res.data;
}

export async function fetchOnboardingStatus() {
  const res = await merchantFetch<{
    data: {
      hasApplication: boolean;
      status?: string;
      storeStatus?: string;
      riskScore?: number;
      tracker?: Array<{ key: string; label: string; done: boolean }>;
      progressPct?: number;
    };
  }>('/api/merchant/onboarding/status');
  return res.data;
}

export async function fetchPostApprovalChecklist() {
  const res = await merchantFetch<{
    data: {
      items: Array<{ key: string; label: string; done: boolean }>;
      progressPct: number;
    };
  }>('/api/merchant/onboarding/checklist');
  return res.data;
}
