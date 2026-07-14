import type { ExtractedAttributesV2 } from '../ai-catalog.types';
import type { ImageOutputType } from '../ai-catalog.constants';

/**
 * Provider abstractions (Dependency Inversion). The pipeline depends on these
 * interfaces, never on OpenAI directly, so a provider can be swapped (Gemini,
 * a self-hosted VLM, Replicate for images) without touching workers/services.
 */

export const AI_VISION_PROVIDER = Symbol('AI_VISION_PROVIDER');
export const AI_IMAGE_PROVIDER = Symbol('AI_IMAGE_PROVIDER');

export interface VisionAnalysisResult {
  attributes: ExtractedAttributesV2;
  /** Model actually used (for audit + cost attribution). */
  model: string;
  /** Best-effort token/cost accounting from the provider response. */
  usage?: { inputTokens?: number; outputTokens?: number; costPaise?: number };
}

export interface AiVisionProvider {
  isConfigured(): boolean;
  assertConfigured(): void;
  /** Analyze a pre-optimized product image URL into the full v2 attribute set. */
  analyze(imageUrl: string): Promise<VisionAnalysisResult>;
}

export interface ImageGenerationRequest {
  outputType: ImageOutputType;
  /** Bytes of the merchant's real product photo (source of truth for shape/label). */
  sourceImage: Buffer;
  /** Facts used to build a faithful, product-specific prompt. */
  context: {
    productName?: string | null;
    brand?: string | null;
    category?: string | null;
    color?: string | null;
    material?: string | null;
    packageType?: string | null;
  };
  transparent: boolean;
}

export interface ImageGenerationResult {
  /** Raw generated image bytes (PNG/WebP). */
  buffer: Buffer;
  provider: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  generationTimeMs: number;
  costPaise: number;
  transparent: boolean;
}

export interface AiImageProvider {
  isConfigured(): boolean;
  /** Produce one output image faithfully derived from the source photo. */
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
