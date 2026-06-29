import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CategoryCatalogKind,
  CategoryScope,
  StoreBusinessTypeStatus,
  VerticalBusinessType,
} from '@prisma/client';
import { StoreCategoryRequestService } from './store-category-request.service';
import { StoreCategoryAccessService } from './store-category-access.service';
import { ConfigService } from '@nestjs/config';
import { MenuService } from '../food/menu.service';
import { VerticalService } from '../store-vertical/vertical.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { catalogKindForStoreBusinessTypes } from './utils/catalog-kind.util';

const mockPrisma = {
  store: { findFirst: jest.fn() },
  storeBusinessType: { findMany: jest.fn(), findFirst: jest.fn() },
  storeCategoryRequest: { findMany: jest.fn(), findFirst: jest.fn() },
  storeCategory: { findMany: jest.fn(), findUnique: jest.fn() },
  category: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
  merchantCategory: { findMany: jest.fn(), findFirst: jest.fn() },
  restaurantMenuCategory: { findFirst: jest.fn(), create: jest.fn() },
};

const mockMerchant = { requireMerchantProfile: jest.fn() };
const mockBlocklist = {
  assertUserNotBlacklisted: jest.fn(),
  assertMerchantProfileNotBlacklisted: jest.fn(),
};
const mockAudit = { log: jest.fn() };
const mockEvents = { emit: jest.fn() };
const mockConfig = {
  get: (key: string) =>
    key === 'UPLOAD_PUBLIC_URL' ? 'https://api.jebdekho.com/uploads' : undefined,
};
const mockVerticalService = {
  ensureStoreBusinessTypesFromApplication: jest.fn().mockResolvedValue([]),
};
const mockCategoryAccess = {
  assertMenuSubcategoryApproved: jest.fn(),
  listApprovedCategoryTree: jest.fn(),
};

describe('Store catalog kind filtering', () => {
  let storeCategoryService: StoreCategoryRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreCategoryRequestService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantService, useValue: mockMerchant },
        { provide: VerificationBlocklistService, useValue: mockBlocklist },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockEvents },
        { provide: StoreCategoryAccessService, useValue: mockCategoryAccess },
        { provide: ConfigService, useValue: mockConfig },
        { provide: VerticalService, useValue: mockVerticalService },
      ],
    }).compile();

    storeCategoryService = module.get(StoreCategoryRequestService);
    jest.clearAllMocks();
    mockMerchant.requireMerchantProfile.mockResolvedValue({ id: 'mp-1' });
    mockPrisma.store.findFirst.mockResolvedValue({ id: 'store-food', merchantProfileId: 'mp-1' });
    mockPrisma.storeCategoryRequest.findMany.mockResolvedValue([]);
    mockPrisma.storeCategory.findMany.mockResolvedValue([]);
  });

  it('resolves MENU catalog for food-only stores', () => {
    expect(
      catalogKindForStoreBusinessTypes([VerticalBusinessType.RESTAURANT]),
    ).toBe(CategoryCatalogKind.MENU);
    expect(
      catalogKindForStoreBusinessTypes([VerticalBusinessType.GROCERY]),
    ).toBe(CategoryCatalogKind.PRODUCT);
  });

  it('listCatalog returns only MENU parents for food stores', async () => {
    mockPrisma.storeBusinessType.findMany.mockResolvedValue([
      { businessType: VerticalBusinessType.RESTAURANT },
    ]);
    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: 'menu-parent',
        name: 'Restaurant & Food',
        catalogKind: CategoryCatalogKind.MENU,
        children: [{ id: 'sub-pizza', name: 'Pizza', requestStatus: null }],
      },
    ]);

    const result = await storeCategoryService.listCatalog('user-1', 'store-food');

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ catalogKind: CategoryCatalogKind.MENU }),
      }),
    );
    expect(result[0].id).toBe('menu-parent');
  });

  it('listCatalog returns only PRODUCT parents for grocery stores', async () => {
    mockPrisma.storeBusinessType.findMany.mockResolvedValue([
      { businessType: VerticalBusinessType.GROCERY },
    ]);
    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: 'product-parent',
        name: 'Grocery',
        catalogKind: CategoryCatalogKind.PRODUCT,
        children: [],
      },
    ]);

    await storeCategoryService.listCatalog('user-1', 'store-grocery');

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ catalogKind: CategoryCatalogKind.PRODUCT }),
      }),
    );
  });
});

describe('Menu category approval gate', () => {
  let menuService: MenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StoreCategoryAccessService, useValue: mockCategoryAccess },
        { provide: VerticalService, useValue: mockVerticalService },
      ],
    }).compile();

    menuService = module.get(MenuService);
    jest.clearAllMocks();
    mockPrisma.store.findFirst.mockResolvedValue({
      id: 'store-food',
      merchantProfileId: 'mp-1',
      deletedAt: null,
      status: 'APPROVED',
    });
    mockPrisma.storeBusinessType.findMany.mockResolvedValue([
      {
        businessType: VerticalBusinessType.RESTAURANT,
        status: StoreBusinessTypeStatus.APPROVED,
      },
    ]);
  });

  it('blocks menu category create without platformCategoryId', async () => {
    await expect(
      menuService.createCategory('mp-1', 'store-food', { platformCategoryId: '' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('blocks menu category create when subcategory is not approved', async () => {
    mockCategoryAccess.assertMenuSubcategoryApproved.mockRejectedValue(
      new ForbiddenException('not authorized'),
    );

    await expect(
      menuService.createCategory('mp-1', 'store-food', {
        platformCategoryId: 'sub-pizza',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates menu category when subcategory is approved', async () => {
    mockCategoryAccess.assertMenuSubcategoryApproved.mockResolvedValue({
      parentId: 'parent-food',
      subcategoryId: 'sub-pizza',
      slug: 'pizza',
      name: 'Pizza',
    });
    mockPrisma.restaurantMenuCategory.findFirst.mockResolvedValue(null);
    mockPrisma.restaurantMenuCategory.create.mockResolvedValue({
      id: 'rmc-1',
      name: 'Pizza',
      platformCategoryId: 'sub-pizza',
    });

    const result = await menuService.createCategory('mp-1', 'store-food', {
      platformCategoryId: 'sub-pizza',
    });

    expect(result.id).toBe('rmc-1');
    expect(mockPrisma.restaurantMenuCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          platformCategoryId: 'sub-pizza',
          name: 'Pizza',
        }),
      }),
    );
  });

  it('allows menu category when food business type is pending on an approved store', async () => {
    mockPrisma.storeBusinessType.findMany.mockResolvedValue([
      {
        businessType: VerticalBusinessType.CLOUD_KITCHEN,
        status: StoreBusinessTypeStatus.PENDING,
      },
    ]);
    mockCategoryAccess.assertMenuSubcategoryApproved.mockResolvedValue({
      parentId: 'parent-food',
      subcategoryId: 'sub-pizza',
      slug: 'pizza',
      name: 'Pizza',
    });
    mockPrisma.restaurantMenuCategory.findFirst.mockResolvedValue(null);
    mockPrisma.restaurantMenuCategory.create.mockResolvedValue({ id: 'rmc-2', name: 'Pizza' });

    const result = await menuService.createCategory('mp-1', 'store-food', {
      platformCategoryId: 'sub-pizza',
    });

    expect(result.id).toBe('rmc-2');
  });

  it('rejects duplicate menu category for same platform subcategory', async () => {
    mockCategoryAccess.assertMenuSubcategoryApproved.mockResolvedValue({
      parentId: 'parent-food',
      subcategoryId: 'sub-pizza',
      slug: 'pizza',
      name: 'Pizza',
    });
    mockPrisma.restaurantMenuCategory.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      menuService.createCategory('mp-1', 'store-food', {
        platformCategoryId: 'sub-pizza',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('StoreCategoryAccessService menu subcategory', () => {
  let accessService: StoreCategoryAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoreCategoryAccessService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    accessService = module.get(StoreCategoryAccessService);
    jest.clearAllMocks();
  });

  it('rejects non-MENU subcategories', async () => {
    mockPrisma.category.findFirst.mockResolvedValue(null);

    await expect(
      accessService.assertMenuSubcategoryApproved('store-1', 'mp-1', 'sub-1'),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrisma.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          catalogKind: CategoryCatalogKind.MENU,
          scope: CategoryScope.GLOBAL,
        }),
      }),
    );
  });

  it('includes approved category requests in MENU tree', async () => {
    mockPrisma.store.findFirst.mockResolvedValue({ merchantProfileId: 'mp-1' });
    mockPrisma.storeCategory.findMany.mockResolvedValue([]);
    mockPrisma.storeCategoryRequest.findMany.mockResolvedValue([
      { categoryId: 'food-parent', subcategoryId: 'pizza-sub' },
    ]);
    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: 'food-parent',
        name: 'Food',
        slug: 'menu-food',
        imageUrl: null,
        icon: null,
        parentId: null,
        sortOrder: 1,
        children: [
          {
            id: 'pizza-sub',
            name: 'Pizza',
            slug: 'pizza',
            imageUrl: null,
            icon: null,
            parentId: 'food-parent',
            sortOrder: 5,
          },
        ],
      },
    ]);

    const tree = await accessService.listApprovedCategoryTree(
      'store-food',
      CategoryCatalogKind.MENU,
    );

    expect(tree).toHaveLength(1);
    expect(tree[0]?.name).toBe('Food');
    expect(tree[0]?.children[0]?.name).toBe('Pizza');
  });
});
