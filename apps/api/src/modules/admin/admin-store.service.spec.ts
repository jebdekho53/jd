import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { AdminStoreService } from './admin-store.service';
import { PrismaService } from '../../database/prisma.service';
import { StoreService } from '../store/store.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

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
  $transaction: jest.fn(),
};
const mockStoreService = { fetchStoreWithRelations: jest.fn() };
const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };

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

    it('throws BadRequestException for non-PENDING_REVIEW store', async () => {
      mockPrisma.store.findUnique.mockResolvedValue({
        ...PENDING_STORE,
        status: StoreStatus.DRAFT,
      });

      await expect(service.approveStore('admin-1', 's-1')).rejects.toThrow(BadRequestException);
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
    it('rejects with reason', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(PENDING_STORE);
      mockPrisma.store.update.mockResolvedValue({
        id: 's-1',
        status: StoreStatus.REJECTED,
        rejectionReason: 'Invalid GST',
      });
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('e-1');

      const result = await service.rejectStore(
        'admin-1',
        's-1',
        { reason: 'Invalid GST number provided.' },
      );

      expect(result.status).toBe(StoreStatus.REJECTED);
      expect(mockDomainEvents.emit).toHaveBeenCalled();
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
