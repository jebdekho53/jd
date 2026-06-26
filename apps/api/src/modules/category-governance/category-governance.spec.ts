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
    mockPrisma.category.findFirst.mockResolvedValue({
      id: 'cat-1',
      name: 'Grocery',
      children: [{ id: 'sub-1' }],
    });
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
