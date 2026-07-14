/**
 * AI Product Cataloging v2 — shared job payload + result types.
 *
 * These are the contracts passed through BullMQ. Keep them serializable
 * (JSON-safe) and versioned via `schemaVersion` so a worker rollout never
 * chokes on an in-flight job enqueued by an older API version.
 */
import type { ImageOutputType } from './ai-catalog.constants';

export const PAYLOAD_SCHEMA_VERSION = 1;

export interface AnalysisJobPayload {
  schemaVersion: number;
  jobLedgerId: string;
  analysisId: string;
  merchantProfileId: string;
  storeId: string;
  userId: string;
  ipAddress?: string;
  /** Whether to auto-queue the default image outputs after a clean analysis. */
  autoGenerateImages: boolean;
}

export interface ImageJobPayload {
  schemaVersion: number;
  jobLedgerId: string;
  imageAssetId: string;
  analysisId: string;
  merchantProfileId: string;
  storeId: string;
  userId: string;
  ipAddress?: string;
  outputType: ImageOutputType;
  /** Force a fresh render even if an identical cached asset exists. */
  forceRegenerate: boolean;
}

export interface RetryJobPayload {
  schemaVersion: number;
  jobLedgerId: string;
  /** Which queue the failed job belonged to. */
  originalQueue: string;
  originalPayload: AnalysisJobPayload | ImageJobPayload;
}

export interface ModerationJobPayload {
  schemaVersion: number;
  jobLedgerId: string;
  analysisId: string;
  merchantProfileId: string;
  storeId: string;
  userId: string;
}

export type AnyJobPayload =
  | AnalysisJobPayload
  | ImageJobPayload
  | RetryJobPayload
  | ModerationJobPayload;

// ── Extraction: the full v2 attribute surface ────────────────────────────────
// The immutable AI output. Written verbatim to AIProductAnalysis.extractedJson.
// Every inferred field carries its own confidence + source via `fieldMeta`.

export type AttributeSource = 'ocr' | 'ai_inferred' | 'default' | 'merchant_required';

export interface FieldMeta {
  confidence: number;
  source: AttributeSource;
}

/** One node of the detected category hierarchy, shallow → deepest. */
export interface CategoryPathNode {
  level: number;
  name: string;
  confidence: number;
}

export interface ExtractedAttributesV2 {
  schemaVersion: number;
  // Identity / taxonomy
  department: string | null;
  category: string | null;
  subCategory: string | null;
  productFamily: string | null;
  productType: string | null;
  categoryTree: CategoryPathNode[];
  brand: string | null;
  productName: string | null;
  model: string | null;
  variant: string | null;
  flavor: string | null;
  // Physical
  color: string | null;
  material: string | null;
  gender: string | null;
  ageGroup: string | null;
  weight: string | null;
  volume: string | null;
  dimensions: string | null;
  quantity: string | null;
  packSize: string | null;
  packageType: string | null;
  containerType: string | null;
  shape: string | null;
  texture: string | null;
  pattern: string | null;
  finish: string | null;
  // Regulatory / commerce (never fabricate legal identifiers)
  countryOfOrigin: string | null;
  mrp: number | null;
  sellingPrice: number | null;
  barcode: string | null;
  hsnCode: string | null;
  gstPercent: number | null;
  manufacturerName: string | null;
  manufacturerAddress: string | null;
  fssaiLicense: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  shelfLife: string | null;
  ingredients: string | null;
  storageInstructions: string | null;
  // Marketing
  certifications: string[];
  claims: string[];
  features: string[];
  seoTitle: string | null;
  shortDescription: string | null;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  searchTags: string[];
  // Signals
  isSupplement: boolean;
  requiresClearLabel: boolean;
  labelReadable: boolean | null;
  canPublishDirectly: boolean;
  imageQualityScore: number;
  confidence: number;
  ocrText: string;
  // Per-field confidence + provenance, keyed by attribute name above.
  fieldMeta: Record<string, FieldMeta>;
}
