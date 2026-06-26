import { Test, TestingModule } from '@nestjs/testing';
import { StoreStatus } from '@prisma/client';
import { BuyerProductService } from './buyer-product.service';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from './buyer-cache.service';

const mockCache = {
  wrap: jest.fn((_, fn: () => Promise<unknown>) => fn()),
};

const PRODUCT = {
  id: 'p-1',
  name: 'Amul Milk',
  slug: 'amul-milk',
  categoryId: 'c-1',
  storeId: 's-1',
  description: null,
  brand: 'Amul',
  imageUrls: [],
  basePrice: { toNumber: () => 49 },
  mrp: { toNumber: () => 59 },
  unit: 'piece',
  isVeg: true,
  tags: ['dairy'],
  category: { id: 'c-1', name: 'Dairy', slug: 'dairy' },
  variants: [
    {
      id: 'v-1',
      name: 'Default',
      price: { toNumber: () => 49 },
      mrp: { toNumber: () => 59 },
      weightGrams: null,
      isDefault: true,
      inventory: { availableQty: 10, reservedQty: 0 },
    },
  ],
  store: {
    id: 's-1',
    name: 'Test Store',
    slug: 'test-store',
    latitude: 28.61,
    longitude: 77.21,
    ratingAvg: 4.5,
    avgPrepTimeMins: 15,
  },
};

const mockPrisma = {
  product: {
    findMany: jest.fn().mockResolvedValue([PRODUCT]),
    findFirst: jest.fn().mockResolvedValue(PRODUCT),
    count: jest.fn().mockResolvedValue(1),
  },
  category: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
  },
  store: { findFirst: jest.fn() },
  merchantCategory: { findMany: jest.fn() },
  storeCategory: { findMany: jest.fn(), findFirst: jest.fn() },
  storePromotion: { findMany: jest.fn().mockResolvedValue([]) },
  $transaction: jest.fn().mockImplementation(async (arr: unknown[]) =>
    Promise.all(arr.map((p) => (p instanceof Promise ? p : Promise.resolve(p)))),
  ),
};

describe('BuyerProductService', () => {
  let service: BuyerProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyerProductService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BuyerCacheService, useValue: mockCache },
      ],
    }).compile();
    service = module.get<BuyerProductService>(BuyerProductService);
    jest.clearAllMocks();
    mockCache.wrap.mockImplementation((_, fn: () => Promise<unknown>) => fn());
    mockPrisma.$transaction.mockImplementation(
      async (arr: [Promise<unknown[]>, Promise<number>]) => Promise.all(arr),
    );
    mockPrisma.product.findMany.mockResolvedValue([PRODUCT]);
    mockPrisma.product.findFirst.mockResolvedValue(PRODUCT);
    mockPrisma.product.count.mockResolvedValue(1);
    mockPrisma.store.findFirst.mockResolvedValue({
      id: 's-1',
      merchantProfileId: 'mp-1',
      status: StoreStatus.APPROVED,
      isActive: true,
      deletedAt: null,
    });
    mockPrisma.merchantCategory.findMany.mockResolvedValue([{ categoryId: 'c-1' }]);
    mockPrisma.storeCategory.findMany.mockResolvedValue([
      { storeId: 's-1', subcategoryId: 'c-1' },
    ]);
    mockPrisma.storeCategory.findFirst.mockResolvedValue({
      storeId: 's-1',
      subcategoryId: 'c-1',
    });
    mockPrisma.category.findFirst.mockResolvedValue({ id: 'c-1', parentId: null });
  });

  describe('listStoreProducts', () => {
    it('returns products for a store', async () => {
      const { products, total } = await service.listStoreProducts('s-1', {
        page: 1,
        limit: 20,
      });

      expect(products).toHaveLength(1);
      expect(total).toBe(1);
      expect(products[0].name).toBe('Amul Milk');
    });

    it('maps variant availableQty correctly', async () => {
      const { products } = await service.listStoreProducts('s-1', {});
      expect(products[0].variants[0].availableQty).toBe(10); // 10 - 0 reserved
    });

    it('passes categoryId filter to prisma', async () => {
      mockPrisma.product.findMany
        .mockResolvedValueOnce([{ categoryId: 'c-1' }])
        .mockResolvedValue([PRODUCT]);
      await service.listStoreProducts('s-1', { categoryId: 'c-1' });
      const productListCall = mockPrisma.product.findMany.mock.calls.find(
        (call) => call[0].include?.variants,
      );
      expect(productListCall?.[0].where.categoryId).toBe('c-1');
    });
  });

  describe('getProductById', () => {
    it('returns a product with store info', async () => {
      const product = await service.getProductById('p-1');
      expect(product).not.toBeNull();
      expect(product!.name).toBe('Amul Milk');
      expect(product!.store.slug).toBe('test-store');
    });

    it('filters by store slug when provided', async () => {
      await service.getProductById('p-1', 'test-store');
      const whereArg = mockPrisma.product.findFirst.mock.calls[0][0].where;
      expect(whereArg.store).toEqual(
        expect.objectContaining({ slug: 'test-store', status: StoreStatus.APPROVED }),
      );
    });

    it('returns null when product is not found', async () => {
      mockPrisma.product.findFirst.mockResolvedValueOnce(null);
      const product = await service.getProductById('missing');
      expect(product).toBeNull();
    });
  });

  describe('searchProducts', () => {
    it('returns results with store info', async () => {
      const { products, total } = await service.searchProducts({
        q: 'amul',
        page: 1,
        limit: 20,
      });

      expect(products).toHaveLength(1);
      expect(total).toBe(1);
      expect(products[0].store.slug).toBe('test-store');
    });

    it('omits text filter when q is not provided', async () => {
      await service.searchProducts({ page: 1, limit: 20 });
      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.OR).toBeUndefined();
      expect(whereArg.searchIndex).toBeUndefined();
    });

    it('uses OR filter for search index, name, and brand when q is provided', async () => {
      await service.searchProducts({ q: 'milk', page: 1, limit: 20 });
      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            searchIndex: { searchText: { contains: 'milk' }, isActive: true },
          }),
          expect.objectContaining({
            name: { contains: 'milk', mode: 'insensitive' },
          }),
          expect.objectContaining({
            brand: { contains: 'milk', mode: 'insensitive' },
          }),
        ]),
      );
    });

    it('applies storeId filter when provided', async () => {
      await service.searchProducts({ q: 'milk', storeId: 's-2' });
      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.storeId).toBe('s-2');
    });
  });

  describe('listCategories', () => {
    it('returns all active global categories from admin catalog', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        {
          id: 'c-1',
          name: 'Dairy',
          slug: 'dairy',
          imageUrl: null,
          parentId: null,
          sortOrder: 0,
          children: [],
        },
      ]);

      const cats = await service.listCategories();
      expect(cats).toHaveLength(1);
      expect(cats[0].slug).toBe('dairy');
      expect(mockPrisma.merchantCategory.findMany).not.toHaveBeenCalled();
    });

    it('uses cache wrapper', async () => {
      mockPrisma.store.findFirst.mockResolvedValue({ id: 's-1' });
      mockPrisma.category.findMany.mockResolvedValue([]);
      await service.listCategories('s-1');
      expect(mockCache.wrap).toHaveBeenCalledWith(
        'buyer:categories:ss-1',
        expect.any(Function),
      );
    });
  });
});
