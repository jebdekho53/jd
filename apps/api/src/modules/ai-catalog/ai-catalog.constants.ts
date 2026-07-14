/**
 * AI Product Cataloging v2 — shared constants.
 *
 * Names, defaults and tunables for the async pipeline. Queue/job names are
 * stable strings (used as Redis keys) and MUST NOT change without a migration
 * plan for in-flight jobs.
 */

// ── Queue names ──────────────────────────────────────────────────────────────
// NOTE: BullMQ forbids ':' in queue names (it is the reserved Redis key
// separator), so these use '-'. The feature never ran in production, so there
// are no in-flight jobs to migrate.
export const AI_QUEUE = {
  ANALYSIS: 'ai-product-analysis',
  IMAGE: 'ai-product-image',
  RETRY: 'ai-product-retry',
  MODERATION: 'ai-product-moderation',
} as const;

export type AiQueueName = (typeof AI_QUEUE)[keyof typeof AI_QUEUE];

export const AI_QUEUE_NAMES: AiQueueName[] = Object.values(AI_QUEUE);

// ── Job names (per queue) ────────────────────────────────────────────────────
export const AI_JOB = {
  ANALYZE_IMAGE: 'analyze-image',
  GENERATE_IMAGE: 'generate-image',
  RETRY_JOB: 'retry-job',
  MODERATE: 'moderate',
} as const;

// ── Default BullMQ job options ───────────────────────────────────────────────
// Uses the "custom" backoff type so our jittered-exponential strategy (see
// workers/backoff.util.ts) applies. Every processor registers that strategy.
export const AI_JOB_DEFAULTS = {
  attempts: 3,
  backoff: { type: 'custom' as const },
  // Keep a bounded history in Redis; the durable ledger lives in Postgres.
  removeOnComplete: { age: 3_600, count: 1_000 },
  removeOnFail: { age: 24 * 3_600, count: 5_000 },
} as const;

// Base delay + ceiling for the jittered exponential backoff strategy.
export const BACKOFF = {
  baseMs: 5_000,
  maxMs: 5 * 60_000,
  jitterRatio: 0.5,
} as const;

// Worker liveness: a job with no heartbeat for stalledIntervalMs is reclaimed;
// after maxStalledCount reclaims it is failed (prevents a crash-looping worker
// from silently reprocessing forever).
export const WORKER_LIVENESS = {
  stalledIntervalMs: 30_000,
  maxStalledCount: 2,
  lockDurationMs: 120_000,
} as const;

// ── Image output types ───────────────────────────────────────────────────────
// Open string union — new types can be added without a schema change. The
// "default" set is generated automatically after analysis; the "onDemand" set
// is generated only when a merchant explicitly requests it from the studio.
export const IMAGE_OUTPUT = {
  MAIN: 'main',
  TRANSPARENT_PNG: 'transparent_png',
  HERO: 'hero',
  LIFESTYLE: 'lifestyle',
  ANGLE_45: 'angle_45',
  INFOGRAPHIC: 'infographic',
  SOCIAL_SQUARE: 'social_square',
  SOCIAL_STORY: 'social_story',
} as const;

export type ImageOutputType = (typeof IMAGE_OUTPUT)[keyof typeof IMAGE_OUTPUT] | (string & {});

export const DEFAULT_IMAGE_OUTPUTS: ImageOutputType[] = [
  IMAGE_OUTPUT.MAIN,
  IMAGE_OUTPUT.TRANSPARENT_PNG,
  IMAGE_OUTPUT.HERO,
];

export const ON_DEMAND_IMAGE_OUTPUTS: ImageOutputType[] = [
  IMAGE_OUTPUT.LIFESTYLE,
  IMAGE_OUTPUT.ANGLE_45,
  IMAGE_OUTPUT.INFOGRAPHIC,
  IMAGE_OUTPUT.SOCIAL_SQUARE,
  IMAGE_OUTPUT.SOCIAL_STORY,
];

export const ALL_IMAGE_OUTPUTS: ImageOutputType[] = [
  ...DEFAULT_IMAGE_OUTPUTS,
  ...ON_DEMAND_IMAGE_OUTPUTS,
];

// Some outputs faithfully preserve the merchant's real product/label (only the
// scene changes); others synthesize geometry the camera never saw. We flag the
// latter so the UI can warn the merchant that shape/label may differ.
export const SYNTHETIC_GEOMETRY_OUTPUTS = new Set<ImageOutputType>([
  IMAGE_OUTPUT.ANGLE_45,
  IMAGE_OUTPUT.LIFESTYLE,
  IMAGE_OUTPUT.INFOGRAPHIC,
]);

// ── Progress event names (WebSocket) ─────────────────────────────────────────
export const AI_WS_EVENT = {
  JOB_PROGRESS: 'ai:job.progress',
  JOB_COMPLETED: 'ai:job.completed',
  JOB_FAILED: 'ai:job.failed',
  IMAGE_READY: 'ai:image.ready',
  MODERATION_UPDATE: 'ai:moderation.update',
} as const;

export const AI_WS_NAMESPACE = '/ai-catalog';

// ── Progress checkpoints (0–100) for the analysis pipeline ───────────────────
export const ANALYSIS_PROGRESS = {
  OPTIMIZING: 10,
  VISION: 35,
  ATTRIBUTES: 60,
  CATEGORY: 75,
  MODERATION: 85,
  IMAGES_QUEUED: 95,
  DONE: 100,
} as const;

// ── Caching ──────────────────────────────────────────────────────────────────
// How long a completed analysis view is cached in Redis (seconds).
export const ANALYSIS_CACHE_TTL_SEC = 300;

// ── Rate limits (per merchant) ───────────────────────────────────────────────
export const RATE_LIMIT = {
  ANALYSES_PER_MINUTE: 6,
  IMAGE_GENS_PER_MINUTE: 12,
};

// ── Concurrency (per worker process) ─────────────────────────────────────────
export const WORKER_CONCURRENCY = {
  ANALYSIS: 4,
  IMAGE: 3,
  RETRY: 2,
  MODERATION: 4,
};
