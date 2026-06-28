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
  ingredients: string;
  shelfLife: string;
  manufacturerName: string;
  fssaiLicense: string;
  barcode: string;
  confidence: number;
}

const VISION_PROMPT = `Analyze this product image and return strict JSON only with this exact schema:
{
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
  "ingredients": "",
  "shelfLife": "",
  "manufacturerName": "",
  "fssaiLicense": "",
  "barcode": "",
  "confidence": 0
}

Rules:
- Be concise
- Do not hallucinate price — if price not visible, return null
- confidence between 0 and 1
- Return JSON only, no markdown`;

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
        max_tokens: 800,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_PROMPT },
              { type: 'image_url', image_url: { url: imageUrl } },
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
        timeout: 60_000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new BadRequestException('AI analysis returned empty response');
    }

    return this.parseExtractedJson(content);
  }

  parseExtractedJson(raw: string): AiExtractedProduct {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('AI returned invalid JSON');
    }

    const confidence = this.clampConfidence(parsed.confidence);
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
      ingredients: String(parsed.ingredients ?? '').slice(0, 5000),
      shelfLife: String(parsed.shelfLife ?? '').slice(0, 200),
      manufacturerName: String(parsed.manufacturerName ?? '').slice(0, 200),
      fssaiLicense: String(parsed.fssaiLicense ?? '').slice(0, 50),
      barcode: String(parsed.barcode ?? '').slice(0, 50),
      confidence,
    };
  }

  private parseNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  private clampConfidence(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
  }
}
