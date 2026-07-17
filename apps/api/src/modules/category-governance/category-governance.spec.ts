import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MerchantCategoryStatus, StoreCategoryRequestStatus } from '@prisma/client';
import { MerchantCategoryAccessService } from './merchant-category-access.service';
import { MerchantCategoryRequestService } from './merchant-category-request.service';
import { AdminCategoryGovernanceService } from './admin-category-governance.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';

const mockPrisma = {
  merchantCategory: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  storeCategoryRequest: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  storeCategory: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  merchantCategoryDocument: { create: jest.fn(), findMany: jest.fn() },
  category: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
  store: { findFirst: jest.fn() },
  product: { groupBy: jest.fn() },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
};

const mockMerchant = {
  requireMerchantProfile: jest.fn(),
  getProfile: jest.fn(),
};

const mockBlocklist = {
  assertUserNotBlacklisted: jest.fn(),
  assertMerchantProfileNotBlacklisted: jest.fn(),
};

const mockAudit = { log: jest.fn() };
const mockEvents = { emit: jest.fn() };
const mockBuyerCache = { deleteByPattern: jest.fn(), invalidate: jest.fn() };

describe('Category Governance', () => {
  let accessService: MerchantCategoryAccessService;
  let merchantService: MerchantCategoryRequestService;
  let adminService: AdminCategoryGovernanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantCategoryAccessService,
        MerchantCategoryRequestService,
        AdminCategoryGovernanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantService, useValue: mockMerchant },
        { provide: VerificationBlocklistService, useValue: mockBlocklist },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockEvents },
        { provide: BuyerCacheService, useValue: mockBuyerCache },
      ],
    }).compile();

    accessService = module.get(MerchantCategoryAccessService);
    merchantService = module.get(MerchantCategoryRequestService);
    adminService = module.get(AdminCategoryGovernanceService);
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);
    mockEvents.emit.mockResolvedValue('e-1');
    mockBlocklist.assertUserNotBlacklisted.mockResolvedValue(undefined);
    mockBlocklist.assertMerchantProfileNotBlacklisted.mockResolvedValue(undefined);
  });

  describe('global catalog tree', () => {
    // L1 Food → L2 Biryani → L3 Hyderabadi → L4 Dum. Flat rows in, tree out:
    // the taxonomy is 4 levels deep and admin has to reach every one of them.
    const flatRows = [
      { id: 'l1', name: 'Food', parentId: null, sortOrder: 0, isActive: true },
      { id: 'l2', name: 'Biryani', parentId: 'l1', sortOrder: 0, isActive: true },
      { id: 'l3', name: 'Hyderabadi', parentId: 'l2', sortOrder: 0, isActive: true },
      { id: 'l4', name: 'Dum', parentId: 'l3', sortOrder: 0, isActive: true },
      { id: 'l1-b', name: 'Grocery', parentId: null, sortOrder: 1, isActive: false },
    ];

    it('nests all four levels under their roots', async () => {
      mockPrisma.category.findMany.mockResolvedValue(flatRows);

      const tree = await adminService.listGlobalCategories();

      expect(tree).toHaveLength(2);
      const food = tree.find((c) => c.id === 'l1')!;
      expect(food.children.map((c) => c.id)).toEqual(['l2']);
      expect(food.children[0].children.map((c) => c.id)).toEqual(['l3']);
      expect(food.children[0].children[0].children.map((c) => c.id)).toEqual(['l4']);
      expect(food.children[0].children[0].children[0].children).toEqual([]);
    });

    it('keeps inactive categories so admin can re-enable them', async () => {
      mockPrisma.category.findMany.mockResolvedValue(flatRows);

      const tree = await adminService.listGlobalCategories();

      expect(tree.map((c) => c.id)).toContain('l1-b');
      // The query itself must not filter on isActive.
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ isActive: expect.anything() }) }),
      );
    });

    it('surfaces a row whose parent is missing rather than dropping it', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 'orphan', name: 'Stray', parentId: 'gone', sortOrder: 0, isActive: true },
      ]);

      const tree = await adminService.listGlobalCategories();

      expect(tree.map((c) => c.id)).toEqual(['orphan']);
    });

    it('soft-deletes the whole subtree, not just direct children', async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ id: 'l1', name: 'Food' });
      // Recursive CTE returns every descendant, L2 through L4.
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 'l2' }, { id: 'l3' }, { id: 'l4' }]);
      mockPrisma.category.updateMany.mockResolvedValue({ count: 4 });

      const res = await adminService.softDeleteGlobalCategory('l1', 'admin-1');

      expect(mockPrisma.category.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ['l1', 'l2', 'l3', 'l4'] } } }),
      );
      expect(res.cascadedCount).toBe(3);
    });
  });

  it('blocks product category when not approved', async () => {
    mockPrisma.merchantCategory.findFirst.mockResolvedValue(null);
    await expect(accessService.assertCategoryApproved('mp-1', 'cat-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows approved merchant category', async () => {
    mockPrisma.merchantCategory.findFirst.mockResolvedValue({ id: 'mc-1' });
    await expect(accessService.assertCategoryApproved('mp-1', 'cat-1')).resolves.toBeUndefined();
  });

  it('merchant can request category access for own profile', async () => {
    mockMerchant.requireMerchantProfile.mockResolvedValue({ id: 'mp-a', userId: 'u-a' });
    mockPrisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Snacks' });
    mockPrisma.merchantCategory.findUnique.mockResolvedValue(null);
    mockPrisma.merchantCategory.create.mockResolvedValue({
      id: 'req-1',
      categoryId: 'cat-1',
      merchantProfileId: 'mp-a',
      status: MerchantCategoryStatus.PENDING,
      category: { name: 'Snacks' },
    });

    const result = await merchantService.requestCategoryAccess('u-a', { categoryId: 'cat-1' });
    expect(result.status).toBe(MerchantCategoryStatus.PENDING);
    expect(mockPrisma.merchantCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ merchantProfileId: 'mp-a' }),
      }),
    );
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CATEGORY_REQUESTED',
        metadata: expect.objectContaining({
          merchantProfileId: 'mp-a',
          requestingUserId: 'u-a',
        }),
      }),
    );
  });

  it('merchant B request uses merchant B profile not merchant A', async () => {
    mockMerchant.requireMerchantProfile.mockResolvedValue({ id: 'mp-b', userId: 'u-b' });
    mockPrisma.category.findFirst.mockResolvedValue({ id: 'cat-2', name: 'Supplements' });
    mockPrisma.merchantCategory.findUnique.mockResolvedValue(null);
    mockPrisma.merchantCategory.create.mockResolvedValue({
      id: 'req-2',
      categoryId: 'cat-2',
      merchantProfileId: 'mp-b',
      status: MerchantCategoryStatus.PENDING,
      category: { name: 'Supplements' },
    });

    await merchantService.requestCategoryAccess('u-b', { categoryId: 'cat-2' });
    expect(mockPrisma.merchantCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ merchantProfileId: 'mp-b' }),
      }),
    );
    expect(mockMerchant.requireMerchantProfile).toHaveBeenCalledWith('u-b');
  });

  it('admin can approve pending request', async () => {
    const pendingRequest = {
      id: 'req-1',
      status: StoreCategoryRequestStatus.PENDING,
      storeId: 'store-1',
      categoryId: 'cat-1',
      subcategoryId: 'sub-1',
    };
    mockPrisma.storeCategoryRequest.findUnique.mockResolvedValue(pendingRequest);
    mockPrisma.$transaction.mockResolvedValue([
      {
        id: 'req-1',
        status: StoreCategoryRequestStatus.APPROVED,
        category: { name: 'Snacks' },
        subcategory: { name: 'Chips' },
        store: { id: 'store-1', name: 'Demo Store', slug: 'demo' },
      },
      { id: 'sc-1' },
    ]);

    const result = await adminService.approveCategoryRequest('req-1', 'admin-1');
    expect(result.status).toBe(StoreCategoryRequestStatus.APPROVED);
    expect(mockEvents.emit).toHaveBeenCalled();
    expect(mockBuyerCache.deleteByPattern).toHaveBeenCalled();
  });

  it('blocks activating category without image', async () => {
    mockPrisma.category.findFirst.mockResolvedValue({
      id: 'cat-1',
      name: 'Grocery',
      imageUrl: null,
      isActive: false,
      parentId: null,
    });

    await expect(
      adminService.updateGlobalCategory('cat-1', { isActive: true }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('admin cannot approve rejected request without revoke', async () => {
    mockPrisma.storeCategoryRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: StoreCategoryRequestStatus.REJECTED,
      storeId: 'store-1',
      categoryId: 'cat-1',
      subcategoryId: 'sub-1',
    });

    await expect(adminService.approveCategoryRequest('req-1', 'admin-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('admin can soft-delete category and cascade children', async () => {
    mockPrisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Grocery' });
    mockPrisma.$queryRaw.mockResolvedValue([{ id: 'sub-1' }]);
    mockPrisma.category.updateMany.mockResolvedValue({ count: 2 });

    const result = await adminService.softDeleteGlobalCategory('cat-1', 'admin-1');
    expect(result.cascadedCount).toBe(1);
    expect(mockPrisma.category.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['cat-1', 'sub-1'] } } }),
    );
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CATEGORY_DELETED' }),
    );
    expect(mockBuyerCache.deleteByPattern).toHaveBeenCalled();
  });

  it('requires parent approval when assigning subcategory product', async () => {
    mockPrisma.category.findFirst
      .mockResolvedValueOnce({
        id: 'sub-1',
        parentId: 'parent-1',
        name: 'Fruits',
      })
      .mockResolvedValueOnce({
        id: 'parent-1',
        deletedAt: null,
        isActive: true,
        storeId: null,
        scope: 'GLOBAL',
      });
    mockPrisma.merchantCategory.findFirst
      .mockResolvedValueOnce({ id: 'mc-parent' })
      .mockResolvedValueOnce(null);

    await expect(
      accessService.assertProductCategoryAllowed('mp-1', 'sub-1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
