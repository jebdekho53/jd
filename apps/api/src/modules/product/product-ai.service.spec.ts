import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { AIProductAnalysisStatus } from '@prisma/client';
import { ProductAiService } from './product-ai.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { AiProductImageService } from './ai-product-image.service';
import { OpenAiVisionClient } from './openai-vision.client';
import { MerchantAiBillingService } from './merchant-ai-billing.service';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { ProductDuplicateService } from './product-duplicate.service';
import { AuditService } from '../audit/audit.service';
import { AI_PRODUCT_UNAVAILABLE_MESSAGE } from './product-ai.constants';

const PROFILE = { id: 'mp-1', userId: 'u-1' };
const ANALYSIS = {
  id: 'a-1',
  merchantProfileId: 'mp-1',
  storeId: 's-1',
  uploadedImageUrl: 'https://cdn/img.jpg',
  extractedJson: { name: 'Milk', sellingPrice: 49, confidence: 0.8 },
  confidence: 0.8,
  status: AIProductAnalysisStatus.COMPLETED,
  errorMessage: null,
  createdProductId: null,
  chargeAmountPaise: 150,
  chargedAt: null,
  createdAt: new Date(),
};

const LOW_CONFIDENCE_ANALYSIS = { ...ANALYSIS, confidence: 0.4 };

const mockPrisma = {
  aIProductAnalysis: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  merchantAiWalletTransaction: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  merchantAiWallet: { findUnique: jest.fn(), upsert: jest.fn() },
  product: { findMany: jest.fn().mockResolvedValue([]) },
  store: { findFirst: jest.fn() },
};

const mockMerchant = { requireMerchantProfile: jest.fn() };
const mockImage = {
  optimizeForAiAnalysis: jest.fn().mockResolvedValue({
    originalUrl: 'https://cdn/original.webp',
    optimizedUrl: 'https://cdn/opt.webp',
    thumbnailUrl: 'https://cdn/thumb.webp',
    aiAnalysisUrl: 'https://cdn/analysis.webp',
  }),
};
const mockWallet = {
  getOrCreateWallet: jest.fn().mockResolvedValue({ balancePaise: 10000 }),
};
const mockVision = {
  analyzeProductImage: jest.fn(),
  isConfigured: jest.fn().mockReturnValue(true),
  assertConfigured: jest.fn(),
};
const mockBilling = {
  assertDailyAnalysisLimit: jest.fn(),
  getPricePaise: jest.fn().mockReturnValue(150),
  getMinRechargePaise: jest.fn().mockReturnValue(10000),
  chargeForProductCreation: jest.fn(),
  refundOnProductCreationFailure: jest.fn(),
};
const mockProduct = { createProduct: jest.fn(), updateStatus: jest.fn() };
const mockCategory = { listCategories: jest.fn().mockResolvedValue([]) };
const mockAudit = { log: jest.fn() };

describe('ProductAiService', () => {
  let service: ProductAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductAiService,
        ProductDuplicateService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantService, useValue: mockMerchant },
        { provide: AiProductImageService, useValue: mockImage },
        { provide: MerchantAiWalletService, useValue: mockWallet },
        { provide: OpenAiVisionClient, useValue: mockVision },
        { provide: MerchantAiBillingService, useValue: mockBilling },
        { provide: ProductService, useValue: mockProduct },
        { provide: CategoryService, useValue: mockCategory },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(ProductAiService);
    jest.clearAllMocks();
    mockMerchant.requireMerchantProfile.mockResolvedValue(PROFILE);
    mockPrisma.store.findFirst.mockResolvedValue({ id: 's-1' });
    mockVision.isConfigured.mockReturnValue(true);
    mockVision.assertConfigured.mockImplementation(() => undefined);
    mockPrisma.product.findMany.mockResolvedValue([]);
  });

  it('returns availability when OpenAI not configured', async () => {
    mockVision.isConfigured.mockReturnValue(false);
    const availability = await service.getAvailability('u-1');
    expect(availability.available).toBe(false);
    expect(availability.message).toBe(AI_PRODUCT_UNAVAILABLE_MESSAGE);
  });

  it('does not charge on analyze', async () => {
    mockPrisma.aIProductAnalysis.create.mockResolvedValue({ id: 'a-1', storeId: 's-1' });
    mockVision.analyzeProductImage.mockResolvedValue({
      name: 'Milk',
      sellingPrice: 49,
      confidence: 0.8,
      categoryName: '',
      subcategoryName: '',
      brand: '',
      unit: 'piece',
      weight: '',
      mrp: null,
      description: '',
      highlights: [],
      tags: [],
      ingredients: null,
      shelfLife: null,
      manufacturerName: null,
      fssaiLicense: null,
      barcode: null,
      isSupplement: false,
      requiresClearLabel: false,
      labelReadable: null,
      canPublishDirectly: true,
      imageQualityScore: 0.8,
    });
    mockPrisma.aIProductAnalysis.update.mockResolvedValue(ANALYSIS);

    await service.analyzeImage('u-1', 's-1', 'data:image/jpeg;base64,abc');

    expect(mockBilling.chargeForProductCreation).not.toHaveBeenCalled();
  });

  it('throws when OpenAI key missing on analyze', async () => {
    mockVision.assertConfigured.mockImplementation(() => {
      throw new ServiceUnavailableException({ message: AI_PRODUCT_UNAVAILABLE_MESSAGE });
    });
    await expect(
      service.analyzeImage('u-1', 's-1', 'data:image/jpeg;base64,abc'),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(mockImage.optimizeForAiAnalysis).not.toHaveBeenCalled();
  });

  it('blocks publish on low confidence', async () => {
    mockPrisma.aIProductAnalysis.findFirst.mockResolvedValue(LOW_CONFIDENCE_ANALYSIS);
    await expect(
      service.confirmAnalysis('u-1', 's-1', 'a-1', {
        name: 'Milk',
        basePrice: 49,
        hsnCodeId: 'hsn-0401',
        publish: true,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(mockBilling.chargeForProductCreation).not.toHaveBeenCalled();
  });

  it('allows draft on low confidence', async () => {
    mockPrisma.aIProductAnalysis.findFirst.mockResolvedValue(LOW_CONFIDENCE_ANALYSIS);
    mockBilling.chargeForProductCreation.mockResolvedValue({
      charged: true,
      amountPaise: 150,
      transactionId: 'tx-1',
    });
    mockProduct.createProduct.mockResolvedValue({ id: 'p-1', name: 'Milk' });
    mockPrisma.aIProductAnalysis.update.mockResolvedValue({});

    const result = await service.confirmAnalysis('u-1', 's-1', 'a-1', {
      name: 'Milk',
      basePrice: 49,
      hsnCodeId: 'hsn-0401',
      publish: false,
    });

    expect(result.publish).toBe(false);
    expect(mockBilling.chargeForProductCreation).toHaveBeenCalled();
  });

  it('charges on confirm', async () => {
    mockPrisma.aIProductAnalysis.findFirst.mockResolvedValue(ANALYSIS);
    mockBilling.chargeForProductCreation.mockResolvedValue({
      charged: true,
      amountPaise: 150,
      transactionId: 'tx-1',
    });
    mockProduct.createProduct.mockResolvedValue({ id: 'p-1', name: 'Milk' });
    mockPrisma.aIProductAnalysis.update.mockResolvedValue({});

    const result = await service.confirmAnalysis('u-1', 's-1', 'a-1', {
      name: 'Milk',
      basePrice: 49,
      hsnCodeId: 'hsn-0401',
      publish: true,
    });

    expect(mockBilling.chargeForProductCreation).toHaveBeenCalledWith('mp-1', 's-1', 'a-1', 'u-1', undefined);
    expect(result.charged).toBe(true);
    expect(result.receipt?.amountPaise).toBe(150);
  });

  it('rejects duplicate on confirm', async () => {
    mockPrisma.aIProductAnalysis.findFirst.mockResolvedValue(ANALYSIS);
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 'p-existing', name: 'Milk', brand: 'Amul', unit: 'piece', sku: 'SKU-1' },
    ]);

    await expect(
      service.confirmAnalysis('u-1', 's-1', 'a-1', {
        name: 'Milk',
        brand: 'Amul',
        unit: 'piece',
        basePrice: 49,
        hsnCodeId: 'hsn-0401',
        publish: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists billing history', async () => {
    mockWallet.getOrCreateWallet.mockResolvedValue({ balancePaise: 5000 });
    mockPrisma.merchantAiWalletTransaction.findMany.mockResolvedValue([
      {
        analysisId: 'a-1',
        amountPaise: 150,
        status: 'SUCCESS',
        type: 'DEBIT',
        reason: 'AI product creation confirmed',
        createdAt: new Date(),
        analysis: {
          id: 'a-1',
          createdProductId: 'p-1',
          extractedJson: { name: 'Milk' },
          createdProduct: { id: 'p-1', name: 'Milk' },
        },
      },
    ]);
    mockPrisma.merchantAiWalletTransaction.count.mockResolvedValue(1);
    mockPrisma.merchantAiWalletTransaction.aggregate
      .mockResolvedValueOnce({ _sum: { amountPaise: 150 } })
      .mockResolvedValueOnce({ _sum: { amountPaise: 0 } });

    const result = await service.listBilling('u-1', 's-1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe('Milk');
    expect(result.items[0].amountPaise).toBe(150);
    expect(result.summary.netRevenuePaise).toBe(150);
  });

  it('guards store ownership on analyze', async () => {
    mockPrisma.store.findFirst.mockResolvedValue(null);
    await expect(
      service.analyzeImage('u-1', 's-1', 'data:image/jpeg;base64,abc'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks supplement publish when label unreadable', async () => {
    const supplementAnalysis = {
      ...ANALYSIS,
      confidence: 0.8,
      extractedJson: {
        name: 'Whey Protein',
        isSupplement: true,
        labelReadable: false,
        canPublishDirectly: false,
      },
    };
    mockPrisma.aIProductAnalysis.findFirst.mockResolvedValue(supplementAnalysis);

    await expect(
      service.confirmAnalysis('u-1', 's-1', 'a-1', {
        name: 'Whey Protein',
        basePrice: 1999,
        hsnCodeId: 'hsn-2106',
        publish: true,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(mockBilling.chargeForProductCreation).not.toHaveBeenCalled();
  });

  it('allows supplement draft when label unreadable', async () => {
    const supplementAnalysis = {
      ...ANALYSIS,
      confidence: 0.8,
      extractedJson: {
        name: 'Whey Protein',
        isSupplement: true,
        labelReadable: false,
        canPublishDirectly: false,
      },
    };
    mockPrisma.aIProductAnalysis.findFirst.mockResolvedValue(supplementAnalysis);
    mockBilling.chargeForProductCreation.mockResolvedValue({
      charged: true,
      amountPaise: 150,
      transactionId: 'tx-1',
    });
    mockProduct.createProduct.mockResolvedValue({ id: 'p-1', name: 'Whey Protein' });
    mockPrisma.aIProductAnalysis.update.mockResolvedValue({});

    const result = await service.confirmAnalysis('u-1', 's-1', 'a-1', {
      name: 'Whey Protein',
      basePrice: 1999,
      hsnCodeId: 'hsn-2106',
      publish: false,
    });

    expect(result.publish).toBe(false);
    expect(mockBilling.chargeForProductCreation).toHaveBeenCalled();
  });
});
