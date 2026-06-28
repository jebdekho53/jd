import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { StoreCategoryAccessService } from '../category-governance/store-category-access.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryCacheService } from '../inventory/inventory-cache.service';

const mockInventoryService = {
  adjustAvailableQty: jest.fn(),
};
const mockInventoryCache = { invalidateForStores: jest.fn() };

const mockCategoryAccess = {
  assertCategoryApproved: jest.fn(),
  assertProductCategoryAllowed: jest.fn(),
};

const MERCHANT_PROFILE = { id: 'mp-1', userId: 'u-1' };
const SAMPLE_IMAGE = 'https://cdn.example.com/product.jpg';
const SAMPLE_LOGO = 'https://cdn.example.com/logo.jpg';
const SAMPLE_BANNER = 'https://cdn.example.com/banner.jpg';
const STORE = { id: 's-1', merchantProfileId: 'mp-1', deletedAt: null };
const VARIANT = {
  id: 'v-1',
  productId: 'p-1',
  sku: 'SKU-001',
  name: 'Default',
  price: 49,
  mrp: 59,
  isDefault: true,
  isActive: true,
};

const INVENTORY = {
  id: 'inv-1',
  variantId: 'v-1',
  availableQty: 10,
  reservedQty: 0,
  soldQty: 0,
  lowStockThreshold: 5,
  version: 0,
  status: 'ACTIVE',
};
const PRODUCT = {
  id: 'p-1',
  storeId: 's-1',
  name: 'Amul Milk',
  slug: 'amul-milk',
  brand: 'Amul',
  sku: null,
  basePrice: 49,
  mrp: 59,
  isActive: true,
  deletedAt: null,
  tags: [],
  imageUrls: ['https://cdn.example.com/milk.jpg'],
  variants: [{ ...VARIANT, inventory: INVENTORY }],
  category: null,
};

const mockPrisma = {
  product: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), count: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  productVariant: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  inventory: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn() },
  productSearchIndex: { upsert: jest.fn(), updateMany: jest.fn() },
  category: { findUnique: jest.fn() },
  store: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};
const mockMerchant = { requireMerchantProfile: jest.fn() };
const mockAudit = { log: jest.fn() };
const mockEvents = { emit: jest.fn() };

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantService, useValue: mockMerchant },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockEvents },
        { provide: StoreCategoryAccessService, useValue: mockCategoryAccess },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: InventoryCacheService, useValue: mockInventoryCache },
      ],
    }).compile();
    service = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  // ── createProduct ─────────────────────────────────────────────────────────

  describe('createProduct', () => {
    it('creates product with default variant and inventory', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
      mockPrisma.product.findFirst.mockResolvedValue(null); // no dupe sku / slug
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.product.create.mockResolvedValue({ ...PRODUCT, id: 'p-new' });
      mockPrisma.productVariant.create.mockResolvedValue(VARIANT);
      mockPrisma.inventory.create.mockResolvedValue(INVENTORY);
      mockPrisma.productSearchIndex.upsert.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue({ ...PRODUCT, variants: [{ ...VARIANT, inventory: INVENTORY }] });
      mockAudit.log.mockResolvedValue(undefined);
      mockEvents.emit.mockResolvedValue('e-1');

      const result = await service.createProduct('u-1', 's-1', {
        name: 'Amul Milk',
        basePrice: 49,
        mrp: 59,
        imageUrls: ['https://cdn.example.com/milk.jpg'],
      });

      expect(mockPrisma.product.create).toHaveBeenCalled();
      expect(mockPrisma.productVariant.create).toHaveBeenCalled();
      expect(mockPrisma.inventory.create).toHaveBeenCalled();
    });

    it('throws BadRequestException when basePrice > mrp', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.createProduct('u-1', 's-1', {
          name: 'Test',
          basePrice: 100,
          mrp: 50,
          imageUrls: [SAMPLE_IMAGE],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when merchant does not own store', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(null);

      await expect(
        service.createProduct('u-1', 's-99', {
          name: 'Test',
          basePrice: 10,
          imageUrls: [SAMPLE_IMAGE],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('persists HSN and GST fields on create', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'c-elec',
        slug: 'electronics',
        name: 'Electronics',
        storeId: null,
        scope: 'GLOBAL',
      });
      mockCategoryAccess.assertProductCategoryAllowed.mockResolvedValue(undefined);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.product.create.mockResolvedValue({ ...PRODUCT, id: 'p-new' });
      mockPrisma.productVariant.create.mockResolvedValue(VARIANT);
      mockPrisma.inventory.create.mockResolvedValue(INVENTORY);
      mockPrisma.productSearchIndex.upsert.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue({ ...PRODUCT, variants: [{ ...VARIANT, inventory: INVENTORY }] });
      mockAudit.log.mockResolvedValue(undefined);
      mockEvents.emit.mockResolvedValue('e-1');

      await service.createProduct('u-1', 's-1', {
        name: 'Gadget',
        basePrice: 499,
        imageUrls: [SAMPLE_IMAGE],
        categoryId: 'c-elec',
        hsnCodeId: 'hsn-8517',
        gstSlab: 'EIGHTEEN',
        taxCategory: 'GOODS',
      });

      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hsnCodeId: 'hsn-8517',
            gstSlab: 'EIGHTEEN',
            taxCategory: 'GOODS',
          }),
        }),
      );
    });

    it('requires HSN for regulated grocery categories', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'c-dairy',
        slug: 'dairy',
        name: 'Dairy',
        storeId: null,
        scope: 'GLOBAL',
      });
      mockCategoryAccess.assertProductCategoryAllowed.mockResolvedValue(undefined);

      await expect(
        service.createProduct('u-1', 's-1', {
          name: 'Milk',
          basePrice: 49,
          imageUrls: [SAMPLE_IMAGE],
          categoryId: 'c-dairy',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── updateInventory ───────────────────────────────────────────────────────

  describe('updateInventory', () => {
    beforeEach(() => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
      mockPrisma.productVariant.findFirst.mockResolvedValue(VARIANT);
      mockPrisma.inventory.findUnique.mockResolvedValue(INVENTORY);
    });

    it('updates inventory quantity', async () => {
      mockInventoryService.adjustAvailableQty.mockResolvedValue({
        availableQty: 50,
        reservedQty: 0,
        soldQty: 0,
        status: 'ACTIVE',
      });
      mockPrisma.inventory.findUniqueOrThrow.mockResolvedValue({ ...INVENTORY, availableQty: 50 });
      mockAudit.log.mockResolvedValue(undefined);
      mockEvents.emit.mockResolvedValue('e-1');

      const result = await service.updateInventory('u-1', 's-1', 'p-1', 'v-1', { quantity: 50 });
      expect(result.availableQty).toBe(50);
      expect(mockInventoryService.adjustAvailableQty).toHaveBeenCalled();
    });

    it('allows zero quantity', async () => {
      mockInventoryService.adjustAvailableQty.mockResolvedValue({
        availableQty: 0,
        reservedQty: 0,
        soldQty: 0,
        status: 'OUT_OF_STOCK',
      });
      mockPrisma.inventory.findUniqueOrThrow.mockResolvedValue({ ...INVENTORY, availableQty: 0 });
      const result = await service.updateInventory('u-1', 's-1', 'p-1', 'v-1', { quantity: 0 });
      expect(result.availableQty).toBe(0);
    });
  });

  // ── updatePrice ───────────────────────────────────────────────────────────

  describe('updatePrice', () => {
    beforeEach(() => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
      mockPrisma.productVariant.findFirst.mockResolvedValue(VARIANT);
    });

    it('throws BadRequestException when new price > mrp', async () => {
      await expect(
        service.updatePrice('u-1', 's-1', 'p-1', 'v-1', { price: 100, mrp: 50 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates variant price and syncs product.basePrice for default variant', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.productVariant.update.mockResolvedValue({ ...VARIANT, price: 45 });
      mockPrisma.product.update.mockResolvedValue({});
      mockAudit.log.mockResolvedValue(undefined);
      mockEvents.emit.mockResolvedValue('e-1');

      const result = await service.updatePrice('u-1', 's-1', 'p-1', 'v-1', { price: 45 });
      expect(result.price).toBe(45);
    });
  });

  // ── updateProductStatus ───────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('throws BadRequestException when activating product without images', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
      mockPrisma.product.findUnique.mockResolvedValue({
        ...PRODUCT,
        imageUrls: [],
        isActive: false,
      });

      await expect(
        service.updateStatus('u-1', 's-1', 'p-1', { isActive: true }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── deleteProduct ─────────────────────────────────────────────────────────

  describe('deleteProduct', () => {
    it('soft-deletes product and deactivates search index', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
      mockPrisma.product.findUnique.mockResolvedValue({ ...PRODUCT });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);
      mockAudit.log.mockResolvedValue(undefined);
      mockEvents.emit.mockResolvedValue('e-1');

      await expect(service.deleteProduct('u-1', 's-1', 'p-1')).resolves.toBeUndefined();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
