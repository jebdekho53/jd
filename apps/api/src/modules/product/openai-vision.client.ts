import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  AI_NOT_CONFIGURED_CODE,
  AI_PRODUCT_UNAVAILABLE_MESSAGE,
} from './product-ai.constants';

export interface AiExtractedProduct {
  ocrText?: string;
  inferredFields?: string[];
  name: string;
  brand: string;
  categoryName: string;
  subcategoryName: string;
  unit: string;
  weight: string;
  mrp: number | null;
  sellingPrice: number | null;
  description: string;
  highlights: string[];
  tags: string[];
  ingredients: string | null;
  shelfLife: string | null;
  manufacturerName: string | null;
  fssaiLicense: string | null;
  barcode: string | null;
  sku?: string | null;
  countryOfOrigin?: string | null;
  manufacturerAddress?: string | null;
  storageInstructions?: string | null;
  disclaimer?: string | null;
  hsnCode?: string | null;
  gstPercent?: number | null;
  isSupplement: boolean;
  requiresClearLabel: boolean;
  labelReadable: boolean | null;
  canPublishDirectly: boolean;
  imageQualityScore: number;
  confidence: number;
  productType?: string;
  cuisine?: string | null;
  dietType?: string | null;
  prepTimeMins?: number | null;
  servingSize?: string | null;
}

const VISION_PROMPT = `You are a product catalog vision assistant for an Indian hyperlocal super-app marketplace (grocery, food, beauty, electronics, pet, flowers, supplements).

The input image has been pre-processed for analysis: square 1:1 framing, white/clean background where possible, centered product, max 1200×1200. Evaluate THIS image as-is.

Your job:
1. OCR/extract all clearly visible product/package text first.
2. Detect productType: PACKAGED_PRODUCT | FRESH_FOOD | RESTAURANT_FOOD | SUPPLEMENT | ELECTRONICS | BEAUTY | PET | FLOWERS | UNKNOWN
3. Parse visible label/package text into product facts.
4. Identify the product from the label, brand, and appearance, then research and fill EVERY field below using your product knowledge when the value is not printed/readable — so the merchant gets a complete draft to review.
5. Track which fields you inferred (from knowledge) vs read (from the label) using "inferredFields".
6. Return strict JSON only — no markdown, no commentary.

Schema (use exactly these keys):
{
  "ocrText": "",
  "inferredFields": [],
  "productType": "PACKAGED_PRODUCT",
  "name": "",
  "brand": "",
  "categoryName": "",
  "subcategoryName": "",
  "unit": "",
  "weight": "",
  "mrp": null,
  "sellingPrice": null,
  "description": "",
  "highlights": [],
  "tags": [],
  "ingredients": null,
  "shelfLife": null,
  "manufacturerName": null,
  "fssaiLicense": null,
  "barcode": null,
  "sku": null,
  "countryOfOrigin": null,
  "manufacturerAddress": null,
  "storageInstructions": null,
  "disclaimer": null,
  "hsnCode": null,
  "gstPercent": null,
  "isSupplement": false,
  "requiresClearLabel": false,
  "labelReadable": null,
  "canPublishDirectly": true,
  "imageQualityScore": 0,
  "confidence": 0,
  "cuisine": null,
  "dietType": null,
  "prepTimeMins": null,
  "servingSize": null
}

Critical rules:
- Return JSON only.
- ocrText: include all clearly readable package/label text, preserving useful line breaks. If no text is readable, return "".
- Fill EVERY field with your best value. Prefer text you can read from the label. When a field is not printed or not readable, infer the most likely correct value from the identified product, brand, and category using your product knowledge, and add that field's key to "inferredFields".
- inferredFields: array of the exact schema keys whose value you inferred from knowledge rather than read directly off the label (e.g. ["hsnCode","gstPercent","ingredients","shelfLife"]). Fields read directly from the label must NOT be listed here.
- Reasonable inference is expected for: description, ingredients, shelfLife, countryOfOrigin, manufacturerName, manufacturerAddress, storageInstructions, hsnCode, gstPercent, mrp, sellingPrice, weight, unit, category, subcategory, tags, highlights, disclaimer.
- NEVER fabricate a legal identifier you cannot read: fssaiLicense and barcode must be null unless clearly printed and readable (these must be real numbers, not guessed).
- If a field's value is genuinely not determinable (e.g. no brand shown), return an empty string "" or null for it — do NOT write placeholder words like "Unknown", "N/A", "Not specified", or "Unbranded". Those placeholders must never appear in any field value.
- Prices (mrp/sellingPrice): if not printed, infer a typical current Indian market price for this exact product as a starting suggestion and list them in inferredFields; the merchant will confirm the final price.
- hsnCode: infer the standard Indian HSN code for this product category (4/6/8 digits). gstPercent: infer the standard GST slab (0/5/12/18/28) for this product. List both in inferredFields when inferred.
- description: a clean, accurate marketplace description; you may use well-known product knowledge, but do not fabricate specific certifications or health claims.

Supplement / health nutrition detection:
- Set "isSupplement": true for protein powder, whey, vitamins, health supplements, sports nutrition, ayurvedic capsules/tablets sold as supplements.
- For supplements:
  - Set "requiresClearLabel": true
  - The image MUST show a clear front-facing label (1:1 product shot preferred).
  - Set "labelReadable": true ONLY if front-label text (product name, brand, net quantity) is sharp and fully readable.
  - Set "canPublishDirectly": false if ANY of:
    • label is unreadable or partially cropped
    • image is not front-facing
    • imageQualityScore < 0.6
    • confidence < 0.55
    • ingredients/FSSAI/manufacturer cannot be read but would be required for supplements
  - For supplements you may infer typical ingredients, manufacturerName, and manufacturerAddress from product knowledge (add them to inferredFields), but fssaiLicense MUST stay null unless the license number is clearly printed and readable.

Scoring:
- "imageQualityScore": 0.0–1.0 — overall photo quality for e-commerce (lighting, focus, product centered, clean background).
- "confidence": 0.0–1.0 — confidence in extracted product data overall.

RESTAURANT_FOOD rules:
- productType RESTAURANT_FOOD for plated/prepared dishes (not packaged retail).
- cuisine: Indian cuisine style if inferable from dish appearance (e.g. Biryani, South Indian).
- dietType: VEG, NON_VEG, or EGG if clearly inferable; null if uncertain.
- prepTimeMins: reasonable estimate 5–60 only for prepared dishes; null if uncertain.
- servingSize: e.g. "1 plate", "2 pcs" if inferable.
- NEVER list specific ingredients unless printed on packaging.`;

@Injectable()
export class OpenAiVisionClient {
  private readonly logger = new Logger(OpenAiVisionClient.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('OPENAI_API_KEY', '').trim());
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException({
        message: AI_PRODUCT_UNAVAILABLE_MESSAGE,
        code: AI_NOT_CONFIGURED_CODE,
      });
    }
  }

  async analyzeProductImage(imageUrl: string): Promise<AiExtractedProduct> {
    this.assertConfigured();

    const model = this.configService.get<string>('OPENAI_VISION_MODEL', 'gpt-4o-mini');
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '')!;

    const response = await this.postVisionRequest(
      {
        model,
        max_tokens: 1200,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_PROMPT },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      },
      apiKey,
      90_000,
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new BadRequestException('AI analysis returned empty response');
    }

    return this.parseExtractedJson(content);
  }

  async analyzeWithCustomPrompt(imageUrl: string, prompt: string): Promise<Record<string, unknown>> {
    this.assertConfigured();

    const model = this.configService.get<string>('OPENAI_VISION_MODEL', 'gpt-4o-mini');
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '')!;

    const response = await this.postVisionRequest(
      {
        model,
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      },
      apiKey,
      120_000,
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new BadRequestException('AI analysis returned empty response');
    }

    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('AI returned invalid JSON');
    }
  }

  /**
   * Generate a professional product image from a text prompt via OpenAI's
   * image generation API. Returns raw PNG bytes as a Buffer.
   */
  async generateProductImage(prompt: string): Promise<Buffer> {
    this.assertConfigured();

    const model = this.configService.get<string>('OPENAI_IMAGE_MODEL', 'gpt-image-1');
    const size = this.configService.get<string>('OPENAI_IMAGE_SIZE', '1024x1024');
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '')!;

    let response;
    try {
      response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model,
          prompt: prompt.slice(0, 4000),
          n: 1,
          size,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120_000,
        },
      );
    } catch (error) {
      this.logger.warn(`OpenAI image generation failed: ${this.describeOpenAiFailure(error)}`);
      throw new ServiceUnavailableException({
        message: 'AI image generation is temporarily unavailable. Please try again.',
        code: AI_NOT_CONFIGURED_CODE,
      });
    }

    const b64 = response.data?.data?.[0]?.b64_json;
    if (typeof b64 === 'string' && b64.length > 0) {
      return Buffer.from(b64, 'base64');
    }

    const url = response.data?.data?.[0]?.url;
    if (typeof url === 'string' && url.length > 0) {
      try {
        const img = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          timeout: 60_000,
        });
        return Buffer.from(img.data);
      } catch (error) {
        this.logger.warn(`Fetching generated image URL failed: ${this.describeOpenAiFailure(error)}`);
      }
    }

    throw new ServiceUnavailableException({
      message: 'AI image generation returned no image. Please try again.',
      code: AI_NOT_CONFIGURED_CODE,
    });
  }

  /**
   * Edit an EXISTING product photo via OpenAI's image edit API — used for the
   * "regenerate" path when a merchant is unhappy with the plain background
   * cleanup. Keeps the product but lets the model re-render the scene.
   */
  async editProductImage(image: Buffer, prompt: string): Promise<Buffer> {
    this.assertConfigured();

    const model = this.configService.get<string>('OPENAI_IMAGE_MODEL', 'gpt-image-1');
    const size = this.configService.get<string>('OPENAI_IMAGE_SIZE', '1024x1024');
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '')!;

    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt.slice(0, 4000));
    form.append('size', size);
    form.append('image', new Blob([new Uint8Array(image)], { type: 'image/png' }), 'product.png');

    let response;
    try {
      response = await axios.post('https://api.openai.com/v1/images/edits', form, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 120_000,
        maxBodyLength: Infinity,
      });
    } catch (error) {
      this.logger.warn(`OpenAI image edit failed: ${this.describeOpenAiFailure(error)}`);
      throw new ServiceUnavailableException({
        message: 'AI image regeneration is temporarily unavailable. Please try again.',
        code: AI_NOT_CONFIGURED_CODE,
      });
    }

    const b64 = response.data?.data?.[0]?.b64_json;
    if (typeof b64 === 'string' && b64.length > 0) {
      return Buffer.from(b64, 'base64');
    }
    const url = response.data?.data?.[0]?.url;
    if (typeof url === 'string' && url.length > 0) {
      const img = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer', timeout: 60_000 });
      return Buffer.from(img.data);
    }
    throw new ServiceUnavailableException({
      message: 'AI image regeneration returned no image. Please try again.',
      code: AI_NOT_CONFIGURED_CODE,
    });
  }

  private async postVisionRequest(
    payload: Record<string, unknown>,
    apiKey: string,
    timeout: number,
  ) {
    try {
      return await axios.post(
        'https://api.openai.com/v1/chat/completions',
        payload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout,
        },
      );
    } catch (error) {
      this.logger.warn(`OpenAI vision request failed: ${this.describeOpenAiFailure(error)}`);
      throw new ServiceUnavailableException({
        message: AI_PRODUCT_UNAVAILABLE_MESSAGE,
        code: AI_NOT_CONFIGURED_CODE,
      });
    }
  }

  private describeOpenAiFailure(error: unknown): string {
    if (!axios.isAxiosError(error)) {
      return error instanceof Error ? error.message : 'unknown error';
    }
    const status = error.response?.status;
    const code = error.code;
    const upstreamMessage =
      typeof error.response?.data?.error?.message === 'string'
        ? error.response.data.error.message
        : error.message;
    return [status ? `status=${status}` : null, code ? `code=${code}` : null, upstreamMessage]
      .filter(Boolean)
      .join(' ');
  }

  parseExtractedJson(raw: string): AiExtractedProduct {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('AI returned invalid JSON');
    }

    const confidence = this.clamp01(parsed.confidence);
    const imageQualityScore = this.clamp01(parsed.imageQualityScore);
    const isSupplement = Boolean(parsed.isSupplement);
    const requiresClearLabel = Boolean(parsed.requiresClearLabel) || isSupplement;
    const labelReadable =
      parsed.labelReadable === null || parsed.labelReadable === undefined
        ? null
        : Boolean(parsed.labelReadable);
    const canPublishDirectly =
      parsed.canPublishDirectly === undefined
        ? !(isSupplement && labelReadable === false)
        : Boolean(parsed.canPublishDirectly);

    return {
      ocrText: String(parsed.ocrText ?? '').slice(0, 8000),
      inferredFields: Array.isArray(parsed.inferredFields)
        ? parsed.inferredFields.map((f) => String(f)).slice(0, 60)
        : [],
      name: this.stripPlaceholder(String(parsed.name ?? '')).slice(0, 200),
      brand: this.stripPlaceholder(String(parsed.brand ?? '')).slice(0, 100),
      categoryName: this.stripPlaceholder(String(parsed.categoryName ?? '')).slice(0, 100),
      subcategoryName: this.stripPlaceholder(String(parsed.subcategoryName ?? '')).slice(0, 100),
      unit: this.stripPlaceholder(String(parsed.unit ?? 'piece')).slice(0, 30) || 'piece',
      weight: this.stripPlaceholder(String(parsed.weight ?? '')).slice(0, 50),
      mrp: this.parseNullableNumber(parsed.mrp),
      sellingPrice: this.parseNullableNumber(parsed.sellingPrice),
      description: String(parsed.description ?? '').slice(0, 2000),
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.map((h) => String(h)).slice(0, 10)
        : [],
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => String(t)).slice(0, 20)
        : [],
      ingredients: this.nullableString(parsed.ingredients, 5000),
      shelfLife: this.nullableString(parsed.shelfLife, 200),
      manufacturerName: this.nullableString(parsed.manufacturerName, 200),
      fssaiLicense: this.nullableString(parsed.fssaiLicense, 50),
      barcode: this.nullableString(parsed.barcode, 50),
      sku: this.nullableString(parsed.sku, 50),
      countryOfOrigin: this.nullableString(parsed.countryOfOrigin, 100),
      manufacturerAddress: this.nullableString(parsed.manufacturerAddress, 1000),
      storageInstructions: this.nullableString(parsed.storageInstructions, 2000),
      disclaimer: this.nullableString(parsed.disclaimer, 2000),
      hsnCode: this.nullableString(parsed.hsnCode, 8),
      gstPercent: this.parseNullableNumber(parsed.gstPercent),
      isSupplement,
      requiresClearLabel,
      labelReadable,
      canPublishDirectly,
      imageQualityScore,
      confidence,
      productType: this.nullableString(parsed.productType, 50) ?? 'UNKNOWN',
      cuisine: this.nullableString(parsed.cuisine, 100),
      dietType: this.nullableString(parsed.dietType, 20),
      prepTimeMins: this.parseNullableNumber(parsed.prepTimeMins),
      servingSize: this.nullableString(parsed.servingSize, 100),
    };
  }

  private nullableString(value: unknown, max: number): string | null {
    if (value === null || value === undefined || value === '') return null;
    const s = this.stripPlaceholder(String(value).trim());
    return s ? s.slice(0, max) : null;
  }

  // Vision models sometimes emit placeholder words when a field can't be read.
  // These must not leak into product data (brand, SKU, or the image prompt).
  private static readonly PLACEHOLDER_VALUES = new Set([
    'unknown', 'n/a', 'na', 'none', 'null', 'not specified', 'not available',
    'not visible', 'unbranded', 'no brand', 'brand unknown', 'not applicable', '-', '—',
  ]);

  private stripPlaceholder(value: string): string {
    return OpenAiVisionClient.PLACEHOLDER_VALUES.has(value.trim().toLowerCase()) ? '' : value;
  }

  private parseNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  private clamp01(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
  }
}
