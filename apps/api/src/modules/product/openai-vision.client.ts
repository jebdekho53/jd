import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  AI_NOT_CONFIGURED_CODE,
  AI_PRODUCT_UNAVAILABLE_MESSAGE,
} from './product-ai.constants';

export interface AiExtractedProduct {
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
1. Detect productType: PACKAGED_PRODUCT | FRESH_FOOD | RESTAURANT_FOOD | SUPPLEMENT | ELECTRONICS | BEAUTY | PET | FLOWERS | UNKNOWN
2. For RESTAURANT_FOOD (prepared dish photos): extract dish name, cuisine, veg/non-veg, estimated prep time, serving size, short description. Do NOT hallucinate ingredients.
3. Assess image quality and extract only clearly readable information.
4. Return strict JSON only — no markdown, no commentary.

Schema (use exactly these keys):
{
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

Critical rules — never violate:
- Return JSON only.
- If text on the package is blurry, cropped, obscured, or not clearly readable → use null for that field.
- NEVER invent or guess: price, MRP, ingredients, FSSAI license, manufacturer, barcode, weight, or shelf life.
- Only populate fields you can directly read from the image.
- description: factual summary from visible packaging only; do not add marketing claims not shown.
- highlights/tags: only from visible text on the package.

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
  - For supplements, leave ingredients/manufacturerName/fssaiLicense as null unless clearly printed and readable.

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

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
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
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 90_000,
      },
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

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
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
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120_000,
      },
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
      name: String(parsed.name ?? '').slice(0, 200),
      brand: String(parsed.brand ?? '').slice(0, 100),
      categoryName: String(parsed.categoryName ?? '').slice(0, 100),
      subcategoryName: String(parsed.subcategoryName ?? '').slice(0, 100),
      unit: String(parsed.unit ?? 'piece').slice(0, 30),
      weight: String(parsed.weight ?? '').slice(0, 50),
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
    const s = String(value).trim();
    return s ? s.slice(0, max) : null;
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
