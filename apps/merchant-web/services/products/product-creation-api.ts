import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type { CreateProductPayload } from '@/types/product';

export interface CsvValidationRow {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  preview: Record<string, unknown>;
}

export interface CsvValidationResult {
  total: number;
  validCount: number;
  invalidCount: number;
  warningCount?: number;
  rows: CsvValidationRow[];
  errorCsv?: string;
}

export interface CsvImportResult {
  imported: number;
  failed: number;
  created: { rowNumber: number; productId: string; name: string }[];
  errors: { rowNumber: number; error: string }[];
}

export interface AiAnalysisResult {
  id: string;
  storeId: string;
  uploadedImageUrl: string;
  extracted: Record<string, unknown>;
  categoryMatch: { matchedCategoryId: string | null; warning: string | null } | null;
  confidence: number | null;
  status: string;
  errorMessage: string | null;
  createdProductId: string | null;
  chargeAmountPaise: number;
  chargeAmountRupee: number;
  chargedAt: string | null;
  createdAt: string;
  lowConfidence: boolean;
  publishBlocked?: boolean;
  supplementBlocked?: boolean;
  supplementWarning?: string | null;
  missingPrice: boolean;
  optimizedImageUrl?: string | null;
  canPublishDirectly?: boolean;
}

export interface AiChargeReceipt {
  analysisId: string;
  productName: string;
  amountPaise: number;
  amountRupee: number;
  chargedAt: string;
  status: string;
}

export interface AiBillingItem {
  analysisId: string | null;
  productName: string;
  amountPaise: number;
  amountRupee: number;
  status: string;
  type: string;
  chargedAt: string | null;
  refundedAt: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AiAvailability {
  available: boolean;
  message: string | null;
  code: string | null;
  pricePaise: number;
  walletBalancePaise?: number;
  walletBalanceRupee?: number;
  minimumRechargePaise?: number;
  minimumRechargeRupee?: number;
  hasSufficientBalance?: boolean;
}

export interface AiConfirmPayload extends Omit<CreateProductPayload, 'imageUrls'> {
  publish: boolean;
}

export async function downloadProductCsvTemplate(storeId: string): Promise<string> {
  const res = await fetch(`/api/merchant/stores/${storeId}/products/csv/template`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to download template');
  return res.text();
}

export async function validateProductCsv(storeId: string, csv: string): Promise<CsvValidationResult> {
  const res = await merchantFetch<ApiResponse<CsvValidationResult>>(
    `/api/merchant/stores/${storeId}/products/csv/validate`,
    { method: 'POST', body: JSON.stringify({ csv }) },
  );
  return res.data;
}

export async function importProductCsv(
  storeId: string,
  csv: string,
  rowNumbers: number[],
): Promise<CsvImportResult> {
  const res = await merchantFetch<ApiResponse<CsvImportResult>>(
    `/api/merchant/stores/${storeId}/products/csv/import`,
    { method: 'POST', body: JSON.stringify({ csv, rowNumbers }) },
  );
  return res.data;
}

export async function analyzeProductPhoto(storeId: string, dataUrl: string): Promise<AiAnalysisResult> {
  const res = await merchantFetch<ApiResponse<AiAnalysisResult>>(
    `/api/merchant/stores/${storeId}/products/ai/analyze`,
    { method: 'POST', body: JSON.stringify({ dataUrl }) },
  );
  return res.data;
}

export async function getAiAnalysis(storeId: string, analysisId: string): Promise<AiAnalysisResult> {
  const res = await merchantFetch<ApiResponse<AiAnalysisResult>>(
    `/api/merchant/stores/${storeId}/products/ai/${analysisId}`,
  );
  return res.data;
}

export async function confirmAiProduct(
  storeId: string,
  analysisId: string,
  payload: AiConfirmPayload,
): Promise<{
  productId: string;
  productName?: string;
  charged: boolean;
  amountPaise: number;
  publish: boolean;
  receipt?: AiChargeReceipt;
}> {
  const res = await merchantFetch<
    ApiResponse<{
      productId: string;
      productName?: string;
      charged: boolean;
      amountPaise: number;
      publish: boolean;
      receipt?: AiChargeReceipt;
    }>
  >(`/api/merchant/stores/${storeId}/products/ai/${analysisId}/confirm`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function cancelAiAnalysis(storeId: string, analysisId: string): Promise<void> {
  await merchantFetch(`/api/merchant/stores/${storeId}/products/ai/${analysisId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getAiAvailability(storeId: string): Promise<AiAvailability> {
  const res = await merchantFetch<ApiResponse<AiAvailability>>(
    `/api/merchant/stores/${storeId}/products/ai/availability`,
  );
  return res.data;
}

export async function getAiBilling(storeId: string): Promise<{ items: AiBillingItem[] }> {
  const res = await merchantFetch<ApiResponse<{ items: AiBillingItem[] }>>(
    `/api/merchant/stores/${storeId}/products/ai/billing`,
  );
  return res.data;
}
