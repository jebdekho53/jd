import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DomainEventType, RejectionType, StoreStatus } from '@prisma/client';
import { AdminStoreService } from './admin-store.service';
import { AdminMerchantService } from './admin-merchant.service';
import { PrismaService } from '../../database/prisma.service';
import { StoreService } from '../store/store.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { MerchantService } from '../merchant/merchant.service';
import { MERCHANT_BLOCKED_MESSAGE } from '../../common/constants/rejection.constants';

const MERCHANT_CTX = {
  id: 'mp-1',
  gstNumber: '29ABCDE1234F1Z5',
  panNumber: 'ABCDE1234F',
  isBlacklisted: false,
  user: { phone: '+919876543211', email: 'merchant@demo.jebdekho.com' },
};

const REJECTED_STORE = {
  id: 's-1',
  name: 'Test Store',
  slug: 'test-store',
  status: StoreStatus.REJECTED,
  merchantProfileId: 'mp-1',
  isActive: false,
  phone: '+919876543211',
  email: 'merchant@demo.jebdekho.com',
  rejectionReason: 'Invalid GST certificate',
  rejectionType: RejectionType.DOCUMENT_ISSUE,
  merchantProfile: MERCHANT_CTX,
};

const mockPrisma = {
  store: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  merchantProfile: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockStoreService = { fetchStoreWithRelations: jest.fn() };
const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };
const mockBuyerCache = { invalidateStoreCache: jest.fn() };
const mockBlocklist = {
  assertNotBlocked: jest.fn(),
  assertUserNotBlacklisted: jest.fn(),
  assertMerchantProfileNotBlacklisted: jest.fn(),
  blockMerchantIdentifiers: jest.fn(),
  removeMerchantIdentifiers: jest.fn(),
};

describe('Store governance', () => {
  let adminStoreService: AdminStoreService;
  let adminMerchantService: AdminMerchantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminStoreService,
        AdminMerchantService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StoreService, useValue: mockStoreService },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
        { provide: BuyerCacheService, useValue: mockBuyerCache },
        { provide: VerificationBlocklistService, useValue: mockBlocklist },
        { provide: EmailNotificationService, useValue: { sendMerchantStoreApproved: jest.fn(), sendMerchantStoreRejected: jest.fn() } },
        { provide: MerchantService, useValue: { ensureMerchantRole: jest.fn() } },
      ],
    }).compile();

    adminStoreService = module.get(AdminStoreService);
    adminMerchantService = module.get(AdminMerchantService);
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);
    mockDomainEvents.emit.mockResolvedValue('e-1');
    mockBlocklist.blockMerchantIdentifiers.mockResolvedValue(undefined);
    mockBlocklist.removeMerchantIdentifiers.mockResolvedValue(undefined);
  });

  describe('rejectStore', () => {
    it('revokes DOCUMENT_ISSUE without blacklisting', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...REJECTED_STORE,
        status: StoreStatus.UNDER_REVIEW,
        rejectionType: null,
      });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.REJECTED,
        rejectionReason: 'Missing GST',
        rejectionType: RejectionType.DOCUMENT_ISSUE,
      });

      const result = await adminStoreService.rejectStore('admin-1', 's-1', {
        reason: 'Missing GST certificate upload.',
        rejectionType: RejectionType.DOCUMENT_ISSUE,
      });

      expect(result.status).toBe(StoreStatus.REJECTED);
      expect(mockBlocklist.blockMerchantIdentifiers).not.toHaveBeenCalled();
      expect(mockPrisma.merchantProfile.update).not.toHaveBeenCalled();
    });

    it('blacklists merchant on FRAUD rejection', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...REJECTED_STORE,
        status: StoreStatus.UNDER_REVIEW,
        rejectionType: null,
      });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.REJECTED,
        rejectionReason: 'Fake GST',
        rejectionType: RejectionType.FRAUD,
      });
      mockPrisma.merchantProfile.update.mockResolvedValue({ id: 'mp-1', isBlacklisted: true });

      await adminStoreService.rejectStore('admin-1', 's-1', {
        reason: 'Fake GST documents detected.',
        rejectionType: RejectionType.FRAUD,
      });

      expect(mockPrisma.merchantProfile.update).toHaveBeenCalled();
      expect(mockBlocklist.blockMerchantIdentifiers).toHaveBeenCalled();
      expect(mockDomainEvents.emit).toHaveBeenCalledWith(
        DomainEventType.MERCHANT_BLACKLISTED,
        'merchant_profile',
        'mp-1',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it.each([
      RejectionType.FRAUD,
      RejectionType.DUPLICATE_ACCOUNT,
      RejectionType.POLICY_VIOLATION,
    ])('cannot revoke %s rejection', async (rejectionType) => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...REJECTED_STORE,
        rejectionType,
        merchantProfile: { ...MERCHANT_CTX, isBlacklisted: true },
      });

      await expect(
        adminStoreService.revokeRejection('admin-1', 's-1', {
          reason: 'Attempting to revoke permanent rejection.',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('revokeRejection', () => {
    it('revokes DOCUMENT_ISSUE rejection', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(REJECTED_STORE);
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.UNDER_REVIEW,
      });

      const result = await adminStoreService.revokeRejection('admin-1', 's-1', {
        reason: 'Merchant has submitted valid documents. Previous rejection revoked.',
      });

      expect(result.status).toBe(StoreStatus.UNDER_REVIEW);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'STORE_REJECTION_REVOKED' }),
      );
      expect(mockDomainEvents.emit).toHaveBeenCalled();
    });

    it('revokes COMPLIANCE_ISSUE rejection', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...REJECTED_STORE,
        rejectionType: RejectionType.COMPLIANCE_ISSUE,
      });
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.UNDER_REVIEW,
      });

      const result = await adminStoreService.revokeRejection('admin-1', 's-1', {
        reason: 'Compliance issue resolved after document resubmission.',
      });

      expect(result.status).toBe(StoreStatus.UNDER_REVIEW);
    });

    it('blocks revoke when merchant is blacklisted', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...REJECTED_STORE,
        merchantProfile: { ...MERCHANT_CTX, isBlacklisted: true },
      });

      await expect(
        adminStoreService.revokeRejection('admin-1', 's-1', {
          reason: 'Should not work while blacklisted.',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeBlacklist (SUPER_ADMIN)', () => {
    it('removes blacklist and reopens store', async () => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue({
        id: 'mp-1',
        isBlacklisted: true,
        gstNumber: '29ABCDE1234F1Z5',
        panNumber: 'ABCDE1234F',
        user: MERCHANT_CTX.user,
      });
      mockPrisma.merchantProfile.update.mockResolvedValue({ id: 'mp-1', isBlacklisted: false });
      mockPrisma.store.findFirst.mockResolvedValue({ id: 's-1' });
      mockPrisma.store.update.mockResolvedValue({ id: 's-1', status: StoreStatus.UNDER_REVIEW });

      const result = await adminMerchantService.removeBlacklist('super-1', 'mp-1', {
        reason: 'False positive confirmed after manual review.',
        reopenStoreId: 's-1',
      });

      expect(result.isBlacklisted).toBe(false);
      expect(result.reopenedStoreId).toBe('s-1');
      expect(mockBlocklist.removeMerchantIdentifiers).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MERCHANT_BLACKLIST_REMOVED' }),
      );
    });
  });
});

describe('VerificationBlocklistService integration expectations', () => {
  it('uses permanent block message', () => {
    expect(MERCHANT_BLOCKED_MESSAGE).toBe(
      'This merchant account has been permanently blocked.',
    );
  });
});

describe('MerchantService blacklist checks', () => {
  it('blocks blacklisted profile creation', async () => {
    const blocklist = {
      assertNotBlocked: jest.fn(),
      assertUserNotBlacklisted: jest.fn().mockRejectedValue(
        new ForbiddenException(MERCHANT_BLOCKED_MESSAGE),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        MerchantService,
        {
          provide: PrismaService,
          useValue: {
            merchantProfile: { findUnique: jest.fn().mockResolvedValue(null) },
            user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ phone: '+91', email: 'a@b.com' }) },
            role: { findUniqueOrThrow: jest.fn() },
            $transaction: jest.fn(),
          },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: VerificationBlocklistService, useValue: blocklist },
      ],
    }).compile();

    const service = module.get(MerchantService);

    await expect(
      service.createProfile('u-1', {
        businessName: 'Test',
        gstNumber: '29ABCDE1234F1Z5',
        panNumber: 'ABCDE1234F',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
