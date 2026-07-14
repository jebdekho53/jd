import { AttributeDataType } from '@prisma/client';
import { AiCatalogAttributeService } from './ai-catalog-attribute.service';
import { AiCatalogAttributeRegistryService, RegistryDefinition, RegistryUnit } from './ai-catalog-attribute-registry.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import { PrismaService } from '../../../database/prisma.service';
import type { ExtractedAttributesV2 } from '../ai-catalog.types';

const UNITS: RegistryUnit[] = [
  { id: 'u_g', key: 'gram', code: 'g', dimension: 'weight', toBaseFactor: 1 },
  { id: 'u_kg', key: 'kilogram', code: 'kg', dimension: 'weight', toBaseFactor: 1000 },
];

const DEF = (over: Partial<RegistryDefinition>): RegistryDefinition => ({
  id: 'd1', key: 'color', name: 'Color', dataType: AttributeDataType.TEXT,
  aiExtractionKey: 'color', unitDimension: null, defaultUnitId: null,
  validationRegex: null, minValue: null, maxValue: null, options: [], ...over,
});

function extracted(over: Partial<ExtractedAttributesV2> = {}): ExtractedAttributesV2 {
  return {
    schemaVersion: 2, confidence: 0.95, fieldMeta: {},
    color: null, material: null, weight: null, gender: null, ageGroup: null,
    categoryTree: [], certifications: [], claims: [], features: [],
    primaryKeywords: [], secondaryKeywords: [], searchTags: [],
    isSupplement: false, requiresClearLabel: false, labelReadable: null,
    canPublishDirectly: true, imageQualityScore: 0.8, ocrText: '',
    department: null, category: null, subCategory: null, productFamily: null, productType: null,
    brand: null, productName: null, model: null, variant: null, flavor: null,
    volume: null, dimensions: null, quantity: null, packSize: null, packageType: null,
    containerType: null, shape: null, texture: null, pattern: null, finish: null,
    countryOfOrigin: null, mrp: null, sellingPrice: null, barcode: null, hsnCode: null, gstPercent: null,
    manufacturerName: null, manufacturerAddress: null, fssaiLicense: null,
    manufacturingDate: null, expiryDate: null, shelfLife: null, ingredients: null, storageInstructions: null,
    seoTitle: null, shortDescription: null,
    ...over,
  };
}

function makeService(defs: RegistryDefinition[], autoApprove = 0.9) {
  const upserts: Record<string, unknown>[] = [];
  const prisma = {
    productAttribute: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn((args: { create: Record<string, unknown> }) => {
        upserts.push(args.create);
        return Promise.resolve({});
      }),
    },
    productAttributeHistory: { create: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(prismaTx)),
  } as unknown as PrismaService;
  const prismaTx = (prisma as unknown as { productAttribute: unknown; productAttributeHistory: unknown });
  const registry = {
    definitionsForCategory: jest.fn().mockResolvedValue(defs),
    units: jest.fn().mockResolvedValue(UNITS),
  } as unknown as AiCatalogAttributeRegistryService;
  const config = { attributeAutoApproveThreshold: jest.fn().mockResolvedValue(autoApprove) } as unknown as AiCatalogConfigService;
  return { svc: new AiCatalogAttributeService(prisma, registry, config), upserts, prisma };
}

describe('AiCatalogAttributeService.syncFromApproval', () => {
  it('auto-approves high-confidence AI values above the threshold', async () => {
    const { svc, upserts } = makeService([DEF({ dataType: AttributeDataType.TEXT })]);
    const res = await svc.syncFromApproval({
      productId: 'p1', analysisId: 'a1', categoryId: 'c1',
      extracted: extracted({ color: 'Blue', fieldMeta: { color: { confidence: 0.95, source: 'ai_inferred' } } }),
      approvals: [],
    });
    expect(res.written).toBe(1);
    expect(upserts[0].valueText).toBe('Blue');
  });

  it('skips low-confidence AI values that are not explicitly approved', async () => {
    const { svc } = makeService([DEF({ dataType: AttributeDataType.TEXT })]);
    const res = await svc.syncFromApproval({
      productId: 'p1', analysisId: 'a1', categoryId: 'c1',
      extracted: extracted({ color: 'Blue', fieldMeta: { color: { confidence: 0.4, source: 'ai_inferred' } } }),
      approvals: [],
    });
    expect(res.written).toBe(0);
    expect(res.skipped).toContain('color');
  });

  it('rejects an ENUM value that is not a real option (never invents options)', async () => {
    const def = DEF({ id: 'd_mat', key: 'material', name: 'Material', dataType: AttributeDataType.ENUM, aiExtractionKey: 'material',
      options: [{ id: 'o1', value: 'cotton', label: 'Cotton', colorHex: null }] });
    const { svc } = makeService([def]);
    const res = await svc.syncFromApproval({
      productId: 'p1', analysisId: 'a1', categoryId: 'c1',
      extracted: extracted({ material: 'vibranium', fieldMeta: { material: { confidence: 0.99, source: 'ai_inferred' } } }),
      approvals: [{ key: 'material', approved: true, value: 'vibranium' }],
    });
    expect(res.written).toBe(0);
    expect(res.rejected[0].key).toBe('material');
  });

  it('normalizes a weight into the base unit for range facets', async () => {
    const def = DEF({ id: 'd_w', key: 'weight', name: 'Weight', dataType: AttributeDataType.WEIGHT, aiExtractionKey: 'weight', unitDimension: 'weight' });
    const { svc, upserts } = makeService([def]);
    await svc.syncFromApproval({
      productId: 'p1', analysisId: 'a1', categoryId: 'c1',
      extracted: extracted({ weight: '1 kg', fieldMeta: { weight: { confidence: 0.95, source: 'ocr' } } }),
      approvals: [],
    });
    expect(upserts[0].normalizedNumber).toBe(1000); // 1 kg → 1000 g
  });

  it('does not overwrite a merchant-verified value on a fresh AI run', async () => {
    const def = DEF({ dataType: AttributeDataType.TEXT });
    const { svc, prisma } = makeService([def]);
    (prisma.productAttribute.findUnique as jest.Mock).mockResolvedValue({ id: 'x', verifiedByMerchant: true });
    const res = await svc.syncFromApproval({
      productId: 'p1', analysisId: 'a2', categoryId: 'c1',
      extracted: extracted({ color: 'Red', fieldMeta: { color: { confidence: 0.99, source: 'ai_inferred' } } }),
      approvals: [], // no merchant edit → must not clobber
    });
    expect(res.written).toBe(0);
    expect(res.skipped).toContain('color');
  });
});
