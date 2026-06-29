import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoreStatus, StoreDocumentType, RejectionType } from '@prisma/client';
import { AdminStoreService } from './admin-store.service';
import { PrismaService } from '../../database/prisma.service';
import { StoreService } from '../store/store.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { MerchantService } from '../merchant/merchant.service';

const PENDING_STORE = {
  id: 's-1',
  name: 'Test Store',
  status: StoreStatus.PENDING_REVIEW,
  merchantProfileId: 'mp-1',
  isActive: false,
};

const mockPrisma = {
  store: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  merchantProfile: { update: jest.fn(), findUnique: jest.fn().mockResolvedValue({ userId: 'u-1' }) },
  storeDocumentRequest: { create: jest.fn() },
  $transaction: jest.fn(),
};
const mockStoreService = { fetchStoreWithRelations: jest.fn() };
const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };
const mockBuyerCache = { invalidateStoreCache: jest.fn() };
const mockBlocklist = {
  assertNotBlocked: jest.fn(),
  blockMerchantIdentifiers: jest.fn(),
};
const mockEmail = {
  sendMerchantStoreApproved: jest.fn(),
  sendMerchantStoreRejected: jest.fn(),
};

describe('AdminStoreService', () => {
  let service: AdminStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminStoreService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StoreService, useValue: mockStoreService },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
        { provide: BuyerCacheService, useValue: mockBuyerCache },
        { provide: VerificationBlocklistService, useValue: mockBlocklist },
        { provide: EmailNotificationService, useValue: mockEmail },
        { provide: MerchantService, useValue: { ensureMerchantRole: jest.fn() } },
      ],
    }).compile();
    service = module.get<AdminStoreService>(AdminStoreService);
    jest.clearAllMocks();
  });

  // ── approveStore ─────────────────────────────────────────────────────────

  describe('approveStore', () => {
    it('approves a PENDING_REVIEW store', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(PENDING_STORE);
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.APPROVED,
        isActive: true,
        reviewedAt: new Date(),
      });
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('e-1');

      const result = await service.approveStore('admin-1', 's-1', '1.2.3.4');

      expect(result.status).toBe(StoreStatus.APPROVED);
      expect(result.isActive).toBe(true);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'STORE_APPROVED' }),
      );
    });

    it('throws BadRequestException for non-approvable store', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...PENDING_STORE,
        status: StoreStatus.DRAFT,
      });

      await expect(service.approveStore('admin-1', 's-1')).rejects.toThrow(BadRequestException);
    });

    it('approves an UNDER_REVIEW store', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...PENDING_STORE,
        status: StoreStatus.UNDER_REVIEW,
      });
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.APPROVED,
        isActive: true,
        reviewedAt: new Date(),
      });
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('e-1');

      const result = await service.approveStore('admin-1', 's-1');

      expect(result.status).toBe(StoreStatus.APPROVED);
    });

    it('throws NotFoundException for missing store', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(null);

      await expect(service.approveStore('admin-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── rejectStore ───────────────────────────────────────────────────────────

  describe('rejectStore', () => {
    it('rejects with reason and blocks identifiers', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...PENDING_STORE,
        phone: '+919876543210',
        email: 'store@test.com',
        merchantProfile: {
          gstNumber: 'GST123',
          panNumber: 'PAN123',
          id: 'mp-1',
          isBlacklisted: false,
          user: { phone: '+919876543210', email: 'merchant@test.com' },
        },
      });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.REJECTED,
        rejectionReason: 'Invalid GST',
      });
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('e-1');
      mockBlocklist.blockMerchantIdentifiers.mockResolvedValue(undefined);

      const result = await service.rejectStore(
        'admin-1',
        's-1',
        { reason: 'Invalid GST number provided.', rejectionType: RejectionType.FRAUD },
      );

      expect(result.status).toBe(StoreStatus.REJECTED);
      expect(mockBlocklist.blockMerchantIdentifiers).toHaveBeenCalled();
      expect(mockDomainEvents.emit).toHaveBeenCalled();
    });
  });

  describe('requestDocuments', () => {
    it('moves store to DOCUMENTS_REQUIRED', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(PENDING_STORE);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.DOCUMENTS_REQUIRED,
        documentRequestReason: 'Upload GST',
        requestedDocumentTypes: ['GST_CERTIFICATE'],
      });
      mockPrisma.storeDocumentRequest.create.mockResolvedValue({ id: 'dr-1' });
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('e-1');

      const result = await service.requestDocuments('admin-1', 's-1', {
        reason: 'Please upload GST certificate.',
        documentTypes: [StoreDocumentType.GST_CERTIFICATE],
      });

      expect(result.status).toBe(StoreStatus.DOCUMENTS_REQUIRED);
    });
  });

  // ── suspendStore ─────────────────────────────────────────────────────────

  describe('suspendStore', () => {
    it('suspends an APPROVED store', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...PENDING_STORE,
        status: StoreStatus.APPROVED,
        isActive: true,
      });
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.SUSPENDED,
        isActive: false,
      });
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('e-1');

      const result = await service.suspendStore(
        'admin-1',
        's-1',
        { reason: 'Policy violation reported.' },
      );

      expect(result.status).toBe(StoreStatus.SUSPENDED);
      expect(result.isActive).toBe(false);
    });

    it('throws BadRequestException for non-APPROVED store', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(PENDING_STORE);

      await expect(
        service.suspendStore('admin-1', 's-1', { reason: 'Some reason here.' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
