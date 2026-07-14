import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  AiImageProvider,
  AiVisionProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
  VisionAnalysisResult,
} from './ai-provider.interface';
import { CATALOG_VISION_PROMPT, buildImagePrompt } from './ai-catalog.prompts';
import type { AttributeSource, ExtractedAttributesV2, FieldMeta, CategoryPathNode } from '../ai-catalog.types';
import { PAYLOAD_SCHEMA_VERSION } from '../ai-catalog.types';
import { IMAGE_OUTPUT } from '../ai-catalog.constants';

const PLACEHOLDERS = new Set([
  'unknown', 'n/a', 'na', 'none', 'null', 'not specified', 'not available',
  'not visible', 'unbranded', 'no brand', 'not applicable', '-', '—',
]);
const VALID_SOURCES: AttributeSource[] = ['ocr', 'ai_inferred', 'default', 'merchant_required'];

/**
 * OpenAI implementation of both provider ports. Vision via chat/completions
 * (JSON mode); image generation via the images/edits endpoint so the merchant's
 * real product pixels are preserved (only the scene is re-rendered). Costs are
 * configurable env tunables for accurate per-generation attribution.
 */
@Injectable()
export class OpenAiCatalogProvider implements AiVisionProvider, AiImageProvider {
  private readonly logger = new Logger(OpenAiCatalogProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('OPENAI_API_KEY', '').trim());
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException({
        message: 'AI cataloging is not configured on this environment.',
        code: 'AI_NOT_CONFIGURED',
      });
    }
  }

  // ── Vision ───────────────────────────────────────────────────────────────────
  async analyze(imageUrl: string): Promise<VisionAnalysisResult> {
    this.assertConfigured();
    const model = this.config.get<string>('OPENAI_VISION_MODEL', 'gpt-4o');
    const apiKey = this.config.get<string>('OPENAI_API_KEY', '')!;

    let response;
    try {
      response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          max_tokens: 2600,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: CATALOG_VISION_PROMPT },
                { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
              ],
            },
          ],
        },
        { headers: this.authHeaders(apiKey), timeout: 120_000 },
      );
    } catch (error) {
      this.logger.warn(`Vision request failed: ${this.describeFailure(error)}`);
      throw new ServiceUnavailableException({
        message: 'AI analysis is temporarily unavailable. Please try again.',
        code: 'AI_VISION_UNAVAILABLE',
      });
    }

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new BadRequestException('AI analysis returned an empty response');

    const usage = response.data?.usage;
    return {
      attributes: this.parse(content),
      model,
      usage: {
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        costPaise: this.config.get<number>('OPENAI_VISION_COST_PAISE', 40),
      },
    };
  }

  // ── Image generation ─────────────────────────────────────────────────────────
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    this.assertConfigured();
    const model = this.config.get<string>('OPENAI_IMAGE_MODEL', 'gpt-image-1');
    const size = this.config.get<string>('OPENAI_IMAGE_SIZE', '1024x1024');
    const apiKey = this.config.get<string>('OPENAI_API_KEY', '')!;
    const { prompt, negativePrompt } = buildImagePrompt(request);
    const started = Date.now();

    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', request.outputType === IMAGE_OUTPUT.SOCIAL_STORY ? '1024x1536' : size);
    if (request.transparent) form.append('background', 'transparent');
    form.append(
      'image',
      new Blob([new Uint8Array(request.sourceImage)], { type: 'image/png' }),
      'source.png',
    );

    let response;
    try {
      response = await axios.post('https://api.openai.com/v1/images/edits', form, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 180_000,
        maxBodyLength: Infinity,
      });
    } catch (error) {
      this.logger.warn(`Image edit failed (${request.outputType}): ${this.describeFailure(error)}`);
      throw new ServiceUnavailableException({
        message: 'AI image generation is temporarily unavailable. Please try again.',
        code: 'AI_IMAGE_UNAVAILABLE',
      });
    }

    const buffer = this.extractImageBytes(response);
    return {
      buffer,
      provider: 'openai',
      model,
      prompt,
      negativePrompt,
      generationTimeMs: Date.now() - started,
      costPaise: this.config.get<number>('OPENAI_IMAGE_COST_PAISE', 150),
      transparent: request.transparent,
    };
  }

  // ── parsing / sanitization ─────────────────────────────────────────────────────
  private parse(raw: string): ExtractedAttributesV2 {
    let p: Record<string, unknown>;
    try {
      p = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('AI returned invalid JSON');
    }

    const isSupplement = Boolean(p.isSupplement);
    const labelReadable =
      p.labelReadable === null || p.labelReadable === undefined ? null : Boolean(p.labelReadable);
    const confidence = this.clamp01(p.confidence);

    return {
      schemaVersion: PAYLOAD_SCHEMA_VERSION,
      department: this.str(p.department),
      category: this.str(p.category),
      subCategory: this.str(p.subCategory),
      productFamily: this.str(p.productFamily),
      productType: this.str(p.productType),
      categoryTree: this.tree(p.categoryTree),
      brand: this.str(p.brand, 100),
      productName: this.str(p.productName, 200),
      model: this.str(p.model, 100),
      variant: this.str(p.variant, 100),
      flavor: this.str(p.flavor, 100),
      color: this.str(p.color, 60),
      material: this.str(p.material, 100),
      gender: this.str(p.gender, 20),
      ageGroup: this.str(p.ageGroup, 40),
      weight: this.str(p.weight, 50),
      volume: this.str(p.volume, 50),
      dimensions: this.str(p.dimensions, 100),
      quantity: this.str(p.quantity, 50),
      packSize: this.str(p.packSize, 50),
      packageType: this.str(p.packageType, 60),
      containerType: this.str(p.containerType, 60),
      shape: this.str(p.shape, 40),
      texture: this.str(p.texture, 40),
      pattern: this.str(p.pattern, 40),
      finish: this.str(p.finish, 40),
      countryOfOrigin: this.str(p.countryOfOrigin, 80),
      mrp: this.num(p.mrp),
      sellingPrice: this.num(p.sellingPrice),
      barcode: this.str(p.barcode, 50),
      hsnCode: this.hsn(p.hsnCode),
      gstPercent: this.num(p.gstPercent),
      manufacturerName: this.str(p.manufacturerName, 200),
      manufacturerAddress: this.str(p.manufacturerAddress, 1000),
      fssaiLicense: this.str(p.fssaiLicense, 50),
      manufacturingDate: this.str(p.manufacturingDate, 40),
      expiryDate: this.str(p.expiryDate, 40),
      shelfLife: this.str(p.shelfLife, 200),
      ingredients: this.str(p.ingredients, 5000),
      storageInstructions: this.str(p.storageInstructions, 2000),
      certifications: this.arr(p.certifications, 20, 120),
      claims: this.arr(p.claims, 20, 200),
      features: this.arr(p.features, 20, 200),
      seoTitle: this.str(p.seoTitle, 70),
      shortDescription: this.str(p.shortDescription, 400),
      primaryKeywords: this.arr(p.primaryKeywords, 15, 60),
      secondaryKeywords: this.arr(p.secondaryKeywords, 25, 60),
      searchTags: this.arr(p.searchTags, 30, 60),
      isSupplement,
      requiresClearLabel: Boolean(p.requiresClearLabel) || isSupplement,
      labelReadable,
      canPublishDirectly:
        p.canPublishDirectly === undefined
          ? !(isSupplement && labelReadable === false)
          : Boolean(p.canPublishDirectly),
      imageQualityScore: this.clamp01(p.imageQualityScore),
      confidence,
      ocrText: String(p.ocrText ?? '').slice(0, 8000),
      fieldMeta: this.fieldMeta(p.fieldMeta, confidence),
    };
  }

  private tree(value: unknown): CategoryPathNode[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((n, i) => {
        const node = (n ?? {}) as Record<string, unknown>;
        const name = this.str(node.name, 120);
        if (!name) return null;
        return {
          level: Number.isFinite(Number(node.level)) ? Number(node.level) : i,
          name,
          confidence: this.clamp01(node.confidence),
        };
      })
      .filter((n): n is CategoryPathNode => n !== null)
      .slice(0, 8);
  }

  private fieldMeta(value: unknown, fallbackConfidence: number): Record<string, FieldMeta> {
    const out: Record<string, FieldMeta> = {};
    if (value && typeof value === 'object') {
      for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        const meta = (v ?? {}) as Record<string, unknown>;
        const source = String(meta.source ?? '').toLowerCase() as AttributeSource;
        out[key] = {
          confidence: this.clamp01(meta.confidence ?? fallbackConfidence),
          source: VALID_SOURCES.includes(source) ? source : 'ai_inferred',
        };
      }
    }
    return out;
  }

  private str(value: unknown, max = 200): string | null {
    if (value === null || value === undefined) return null;
    const s = String(value).trim();
    if (!s || PLACEHOLDERS.has(s.toLowerCase())) return null;
    return s.slice(0, max);
  }

  private arr(value: unknown, maxItems: number, maxLen: number): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((v) => this.str(v, maxLen))
      .filter((v): v is string => Boolean(v))
      .slice(0, maxItems);
  }

  private num(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  private hsn(value: unknown): string | null {
    const normalized = String(value ?? '').replace(/[^\d]/g, '');
    return /^\d{4}(\d{2}){0,2}$/.test(normalized) ? normalized : null;
  }

  private clamp01(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
  }

  private extractImageBytes(response: { data?: { data?: Array<{ b64_json?: string; url?: string }> } }): Buffer {
    const first = response.data?.data?.[0];
    if (first?.b64_json) return Buffer.from(first.b64_json, 'base64');
    if (first?.url) {
      // Fetched synchronously by the caller path is avoided; only b64 expected
      // from images/edits. A URL response is a provider anomaly — surface it.
    }
    throw new ServiceUnavailableException({
      message: 'AI image generation returned no image. Please try again.',
      code: 'AI_IMAGE_EMPTY',
    });
  }

  private authHeaders(apiKey: string): Record<string, string> {
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }

  private describeFailure(error: unknown): string {
    if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : 'unknown error';
    const status = error.response?.status;
    const upstream =
      typeof error.response?.data?.error?.message === 'string'
        ? error.response.data.error.message
        : error.message;
    return [status ? `status=${status}` : null, upstream].filter(Boolean).join(' ');
  }
}
