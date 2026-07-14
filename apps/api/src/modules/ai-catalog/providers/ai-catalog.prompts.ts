import { IMAGE_OUTPUT, ImageOutputType } from '../ai-catalog.constants';
import type { ImageGenerationRequest } from './ai-provider.interface';

/**
 * The v2 vision prompt. Extracts the full attribute surface + deepest category
 * hierarchy + SEO, and REQUIRES a per-field `fieldMeta` map so every value
 * carries its own confidence + source. Never fabricates legal identifiers.
 */
export const CATALOG_VISION_PROMPT = `You are the product-cataloging vision engine for JebDekho, an Indian hyperlocal marketplace (grocery, electronics, fashion, beauty, medicine, supplements, books, kitchen, furniture, toys, pet, jewellery, footwear, automotive, sports, baby care, stationery — everything).

The input image is pre-processed: 1:1 framing, clean background, centered product, up to 1200x1200. Analyze THIS image as-is.

Do ALL of the following and return STRICT JSON only (no markdown, no prose):
1. OCR every clearly readable word on the product/packaging into "ocrText".
2. Identify the product from label + brand + appearance.
3. Detect the DEEPEST category hierarchy you can justify — never stop at a generic level. Return it as "categoryTree": an ordered array from broadest to most specific, each { "level": 0-based, "name": string, "confidence": 0..1 }. Example for whey: [{"level":0,"name":"Health & Nutrition","confidence":0.98},{"level":1,"name":"Supplements","confidence":0.95},{"level":2,"name":"Protein","confidence":0.93},{"level":3,"name":"Whey Protein","confidence":0.9}].
4. Fill EVERY attribute below. Prefer values read off the label; otherwise infer the most likely correct value from product knowledge. NEVER invent legal identifiers (barcode, fssaiLicense) — those must be null unless clearly printed.
5. For EVERY attribute you output, add an entry to "fieldMeta" keyed by the attribute name with { "confidence": 0..1, "source": "ocr" | "ai_inferred" | "default" | "merchant_required" }. Use "ocr" only for values literally read from the label; "ai_inferred" for knowledge-based guesses; "merchant_required" when you cannot determine it and a human must supply it.
6. Write commerce-ready SEO: "seoTitle" (<=70 chars), "shortDescription" (1-2 sentences), and keyword arrays.

Use EXACTLY these JSON keys (unknown scalars -> null, unknown arrays -> []):
{
  "ocrText": "",
  "department": null, "category": null, "subCategory": null, "productFamily": null, "productType": null,
  "categoryTree": [],
  "brand": null, "productName": null, "model": null, "variant": null, "flavor": null,
  "color": null, "material": null, "gender": null, "ageGroup": null,
  "weight": null, "volume": null, "dimensions": null, "quantity": null, "packSize": null,
  "packageType": null, "containerType": null, "shape": null, "texture": null, "pattern": null, "finish": null,
  "countryOfOrigin": null, "mrp": null, "sellingPrice": null, "barcode": null, "hsnCode": null, "gstPercent": null,
  "manufacturerName": null, "manufacturerAddress": null, "fssaiLicense": null,
  "manufacturingDate": null, "expiryDate": null, "shelfLife": null, "ingredients": null, "storageInstructions": null,
  "certifications": [], "claims": [], "features": [],
  "seoTitle": null, "shortDescription": null,
  "primaryKeywords": [], "secondaryKeywords": [], "searchTags": [],
  "isSupplement": false, "requiresClearLabel": false, "labelReadable": null, "canPublishDirectly": true,
  "imageQualityScore": 0, "confidence": 0,
  "fieldMeta": {}
}

Rules:
- Return JSON only. No key omitted.
- Do NOT emit placeholder words ("Unknown","N/A","Not specified","Unbranded","-"). Use null/"" instead.
- gender: one of Men, Women, Unisex, Boys, Girls, Baby, null. ageGroup: e.g. "Adult", "Kids", "0-2 years", null.
- hsnCode: infer the standard Indian HSN (4/6/8 digits) for the category; gstPercent: standard slab (0/5/12/18/28). Mark both "ai_inferred" unless printed.
- mrp/sellingPrice: if not printed, infer a typical current Indian price and mark "ai_inferred"; the merchant confirms final price.
- Supplements/medicine: set isSupplement true (supplements), requiresClearLabel true; set canPublishDirectly false if the label is unreadable, cropped, not front-facing, imageQualityScore < 0.6, or confidence < 0.55.
- imageQualityScore (0..1): e-commerce photo quality. confidence (0..1): overall extraction confidence.`;

const NEGATIVE_PROMPT =
  'no watermark, no text overlay, no added logo, no extra props, no hands, no reflES, no glare, no clutter, no distortion of the product shape, do not alter or redraw any printed label text or brand mark';

/**
 * Build a faithful, output-specific image prompt. Every prompt hard-constrains
 * the model to preserve the real product, brand, label text, shape, color and
 * quantity — only the scene/lighting changes. Outputs that necessarily
 * synthesize new geometry (angle_45, lifestyle) say so explicitly but still
 * forbid changing the product identity.
 */
export function buildImagePrompt(request: ImageGenerationRequest): {
  prompt: string;
  negativePrompt: string;
} {
  const { context, outputType, transparent } = request;
  const subject = [context.brand, context.productName].filter(Boolean).join(' ') || 'this product';
  const preserve =
    `Keep THIS exact ${context.category ?? 'product'} (${subject}) and its printed label, brand mark, text, ` +
    `${context.color ? context.color + ' color, ' : ''}${context.material ? context.material + ' material, ' : ''}` +
    `shape and quantity completely unchanged. Do not redraw, translate, or replace any text or logo.`;

  const base: Record<ImageOutputType, string> = {
    [IMAGE_OUTPUT.MAIN]:
      `${preserve} Place it centered on a seamless pure-white studio background with soft, even, professional studio lighting and a subtle natural contact shadow. Ultra-realistic commercial e-commerce main product shot, sharp label, correct perspective, colors true to the source. Remove background clutter, glare, wrinkles and noise.`,
    [IMAGE_OUTPUT.TRANSPARENT_PNG]:
      `${preserve} Cleanly cut the product out onto a fully transparent background with crisp anti-aliased edges and no halo. Studio-clean, sharp, color-accurate.`,
    [IMAGE_OUTPUT.HERO]:
      `${preserve} Premium hero product photo: dark-to-light gradient studio backdrop, dramatic soft key light with gentle rim light, elegant reflection, high-end advertising look. The product stays the true visual hero, unmodified.`,
    [IMAGE_OUTPUT.LIFESTYLE]:
      `${preserve} Natural lifestyle context appropriate to a ${context.category ?? 'retail'} product (tasteful, uncluttered, realistic setting), soft daylight. The product remains the clear focus, identical to the source.`,
    [IMAGE_OUTPUT.ANGLE_45]:
      `${preserve} Present the same product at a 45-degree three-quarter angle on a seamless white studio background with soft shadow. Keep the front label readable; do not invent details not visible in the source.`,
    [IMAGE_OUTPUT.INFOGRAPHIC]:
      `${preserve} Clean e-commerce infographic layout on white: the product on the left, with tasteful minimal callout lines pointing to real, visible features. Do not fabricate specs or claims.`,
    [IMAGE_OUTPUT.SOCIAL_SQUARE]:
      `${preserve} Eye-catching 1:1 social-media product post with a soft branded gradient background and generous negative space for later text. Product unmodified and centered.`,
    [IMAGE_OUTPUT.SOCIAL_STORY]:
      `${preserve} Vertical 9:16 social story composition with the product centered on a soft gradient, ample top/bottom negative space. Product unmodified.`,
  };

  const prompt =
    (base[outputType] ??
      `${preserve} Professional white-background studio product photo, soft shadow, ultra realistic.`) +
    (transparent ? '' : ' 8K-quality, crisp focus.');

  return { prompt: prompt.slice(0, 3900), negativePrompt: NEGATIVE_PROMPT };
}
