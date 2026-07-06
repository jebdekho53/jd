"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OpenAiVisionClient_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiVisionClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const product_ai_constants_1 = require("./product-ai.constants");
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
let OpenAiVisionClient = OpenAiVisionClient_1 = class OpenAiVisionClient {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(OpenAiVisionClient_1.name);
    }
    isConfigured() {
        return Boolean(this.configService.get('OPENAI_API_KEY', '').trim());
    }
    assertConfigured() {
        if (!this.isConfigured()) {
            throw new common_1.ServiceUnavailableException({
                message: product_ai_constants_1.AI_PRODUCT_UNAVAILABLE_MESSAGE,
                code: product_ai_constants_1.AI_NOT_CONFIGURED_CODE,
            });
        }
    }
    async analyzeProductImage(imageUrl) {
        this.assertConfigured();
        const model = this.configService.get('OPENAI_VISION_MODEL', 'gpt-4o-mini');
        const apiKey = this.configService.get('OPENAI_API_KEY', '');
        const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
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
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 90_000,
        });
        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new common_1.BadRequestException('AI analysis returned empty response');
        }
        return this.parseExtractedJson(content);
    }
    async analyzeWithCustomPrompt(imageUrl, prompt) {
        this.assertConfigured();
        const model = this.configService.get('OPENAI_VISION_MODEL', 'gpt-4o-mini');
        const apiKey = this.configService.get('OPENAI_API_KEY', '');
        const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
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
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 120_000,
        });
        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new common_1.BadRequestException('AI analysis returned empty response');
        }
        try {
            return JSON.parse(content);
        }
        catch {
            throw new common_1.BadRequestException('AI returned invalid JSON');
        }
    }
    parseExtractedJson(raw) {
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            throw new common_1.BadRequestException('AI returned invalid JSON');
        }
        const confidence = this.clamp01(parsed.confidence);
        const imageQualityScore = this.clamp01(parsed.imageQualityScore);
        const isSupplement = Boolean(parsed.isSupplement);
        const requiresClearLabel = Boolean(parsed.requiresClearLabel) || isSupplement;
        const labelReadable = parsed.labelReadable === null || parsed.labelReadable === undefined
            ? null
            : Boolean(parsed.labelReadable);
        const canPublishDirectly = parsed.canPublishDirectly === undefined
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
    nullableString(value, max) {
        if (value === null || value === undefined || value === '')
            return null;
        const s = String(value).trim();
        return s ? s.slice(0, max) : null;
    }
    parseNullableNumber(value) {
        if (value === null || value === undefined || value === '')
            return null;
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? n : null;
    }
    clamp01(value) {
        const n = Number(value);
        if (!Number.isFinite(n))
            return 0;
        return Math.min(1, Math.max(0, n));
    }
};
exports.OpenAiVisionClient = OpenAiVisionClient;
exports.OpenAiVisionClient = OpenAiVisionClient = OpenAiVisionClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], OpenAiVisionClient);
//# sourceMappingURL=openai-vision.client.js.map