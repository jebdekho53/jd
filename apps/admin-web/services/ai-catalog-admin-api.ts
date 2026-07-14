import { adminFetch } from '@/services/api/admin-client';

/** Admin client for AI Catalog v2 monitoring + controls (via BFF proxy). */

interface Wrapped<T> {
  success?: boolean;
  data?: T;
}

function unwrap<T>(p: Promise<unknown>): Promise<T> {
  return p.then((r) => ((r as Wrapped<T>)?.data ?? r) as T);
}

export interface QueueHealth {
  queues: Record<string, Record<string, number>>;
  ledger: { failed: number; moderationPending: number };
}

export interface CatalogConfig {
  enabled: boolean;
  pricing: { analysisPaise: number; perOutputPaise: Record<string, number> };
  disabledOutputs: string[];
  categoryAutoSelectThreshold: number;
  attributeAutoApproveThreshold: number;
  publishMinConfidence: number;
  dailyAnalysisLimit: number;
  visionModel: string;
  imageModel: string;
}

export const aiCatalogAdminApi = {
  queueHealth: () => unwrap<QueueHealth>(adminFetch('/api/ai-catalog/queue-health')),
  getConfig: () => unwrap<CatalogConfig>(adminFetch('/api/ai-catalog/config')),
  setConfig: (key: string, value: unknown) =>
    unwrap(adminFetch('/api/ai-catalog/config', { method: 'POST', body: JSON.stringify({ key, value }) })),
  failedJobs: (page = 1) =>
    unwrap<{ items: { id: string; queueName: string; errorMessage: string | null; updatedAt: string }[]; meta: { total: number } }>(
      adminFetch(`/api/ai-catalog/jobs/failed?page=${page}`),
    ),
  redrive: (jobId: string) => unwrap(adminFetch(`/api/ai-catalog/jobs/${jobId}/redrive`, { method: 'POST' })),
  moderation: (page = 1) =>
    unwrap<{ items: { id: string; storeId: string; confidence: number | null; uploadedImageUrl: string; extractedJson: unknown }[]; meta: { total: number } }>(
      adminFetch(`/api/ai-catalog/moderation?page=${page}`),
    ),
  resolveModeration: (analysisId: string, approve: boolean, reason?: string) =>
    unwrap(adminFetch(`/api/ai-catalog/moderation/${analysisId}`, { method: 'POST', body: JSON.stringify({ approve, reason }) })),
};
