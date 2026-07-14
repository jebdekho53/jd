import { AiCatalogModerationService } from './ai-catalog-moderation.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import type { ExtractedAttributesV2 } from '../ai-catalog.types';

function ex(over: Partial<ExtractedAttributesV2>): ExtractedAttributesV2 {
  return {
    schemaVersion: 2, confidence: 0.9, imageQualityScore: 0.8, isSupplement: false,
    labelReadable: true, canPublishDirectly: true, categoryTree: [], department: null,
    category: null, subCategory: null, productType: null, productName: null,
    fieldMeta: {}, certifications: [], claims: [], features: [], primaryKeywords: [],
    secondaryKeywords: [], searchTags: [], ocrText: '', requiresClearLabel: false,
    productFamily: null, brand: null, model: null, variant: null, flavor: null, color: null,
    material: null, gender: null, ageGroup: null, weight: null, volume: null, dimensions: null,
    quantity: null, packSize: null, packageType: null, containerType: null, shape: null,
    texture: null, pattern: null, finish: null, countryOfOrigin: null, mrp: null,
    sellingPrice: null, barcode: null, hsnCode: null, gstPercent: null, manufacturerName: null,
    manufacturerAddress: null, fssaiLicense: null, manufacturingDate: null, expiryDate: null,
    shelfLife: null, ingredients: null, storageInstructions: null, seoTitle: null, shortDescription: null,
    ...over,
  };
}

function makeService(minConfidence = 0.55) {
  const config = { publishMinConfidence: jest.fn().mockResolvedValue(minConfidence) } as unknown as AiCatalogConfigService;
  return new AiCatalogModerationService(config);
}

describe('AiCatalogModerationService', () => {
  it('auto-approves a clean, confident everyday product', async () => {
    const res = await makeService().evaluate(ex({ category: 'Grocery', productName: 'Peanut Butter' }));
    expect(res.decision).toBe('auto_approved');
    expect(res.reasons).toHaveLength(0);
  });

  it('flags restricted categories (medicine) for review', async () => {
    const res = await makeService().evaluate(ex({ category: 'Medicine', productName: 'Antibiotic tablet' }));
    expect(res.decision).toBe('needs_review');
    expect(res.reasons.join(' ')).toMatch(/Restricted/);
  });

  it('flags low overall confidence', async () => {
    const res = await makeService().evaluate(ex({ confidence: 0.3 }));
    expect(res.decision).toBe('needs_review');
  });

  it('flags supplements with an unreadable label', async () => {
    const res = await makeService().evaluate(ex({ isSupplement: true, labelReadable: false, canPublishDirectly: false }));
    expect(res.decision).toBe('needs_review');
  });
});
