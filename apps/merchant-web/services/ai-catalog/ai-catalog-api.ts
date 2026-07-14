import { merchantFetch } from '@/services/api/merchant-client';

/**
 * Client for AI Product Cataloging v2. All calls go through the merchant BFF
 * proxy (`/api/merchant/stores/:storeId/products/ai-catalog/*`), which injects
 * auth and forwards to the NestJS API. The v1 client is untouched.
 */

const base = (storeId: string) => `/api/merchant/stores/${storeId}/products/ai-catalog`;

export interface CatalogAvailability {
  enabled: boolean;
  pricing: { analysisPaise: number; perOutputPaise: Record<string, number> };
  defaultOutputs: string[];
}

export interface QueueAnalysisResponse {
  analysisId: string;
  jobLedgerId: string;
  status: string;
}

export interface JobStatus {
  jobId: string;
  jobType: string;
  status: string;
  progress: number;
  analysisId: string | null;
  imageAssetId: string | null;
  errorMessage: string | null;
  retryable: boolean;
  updatedAt: string;
}

export interface ImageAssetView {
  id: string;
  outputType: string;
  version: number;
  status: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  transparent: boolean;
  approvalStatus: string;
  isSelected: boolean;
  generationCostPaise: number;
  syntheticGeometry: boolean;
}

export interface AnalysisView {
  analysisId: string;
  storeId: string;
  status: string;
  confidence: number | null;
  uploadedImageUrl: string;
  thumbnailImageUrl: string | null;
  attributes: Record<string, unknown> | null;
  categoryMatch: {
    candidates: { categoryId: string; path: string[]; score: number }[];
    autoSelected: { categoryId: string; path: string[] } | null;
    requiresConfirmation: boolean;
  } | null;
  moderation: { decision: string; reasons: string[] } | null;
  imageAssets: ImageAssetView[];
  createdProductId: string | null;
}

function unwrap<T>(p: Promise<{ success?: boolean; data?: T }>): Promise<T> {
  return p.then((r) => r.data as T);
}

export const aiCatalogApi = {
  availability: (storeId: string) => unwrap<CatalogAvailability>(merchantFetch(`${base(storeId)}/availability`)),

  analyze: (storeId: string, dataUrl: string, autoGenerateImages = true) =>
    unwrap<QueueAnalysisResponse>(
      merchantFetch(`${base(storeId)}/analyze`, { method: 'POST', body: JSON.stringify({ dataUrl, autoGenerateImages }) }),
    ),

  getAnalysis: (storeId: string, analysisId: string) =>
    unwrap<AnalysisView>(merchantFetch(`${base(storeId)}/analysis/${analysisId}`)),

  getJob: (storeId: string, jobId: string) =>
    unwrap<JobStatus>(merchantFetch(`${base(storeId)}/jobs/${jobId}`)),

  generateImages: (storeId: string, analysisId: string, outputTypes: string[], forceRegenerate = false) =>
    unwrap<{ outputs: unknown[]; estimate: { lines: { outputType: string; amountPaise: number; cached: boolean }[]; totalPaise: number } }>(
      merchantFetch(`${base(storeId)}/analysis/${analysisId}/images`, {
        method: 'POST',
        body: JSON.stringify({ outputTypes, forceRegenerate }),
      }),
    ),

  imageAction: (storeId: string, assetId: string, action: 'approve' | 'reject' | 'select') =>
    unwrap(merchantFetch(`${base(storeId)}/images/${assetId}/action`, { method: 'POST', body: JSON.stringify({ action }) })),

  confirm: (storeId: string, analysisId: string, payload: Record<string, unknown>) =>
    unwrap<{ productId: string; publish: boolean; charged: boolean; amountPaise: number }>(
      merchantFetch(`${base(storeId)}/analysis/${analysisId}/confirm`, { method: 'POST', body: JSON.stringify(payload) }),
    ),
};
