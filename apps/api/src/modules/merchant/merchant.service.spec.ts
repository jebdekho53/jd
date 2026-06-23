import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import { MerchantService } from './merchant.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

const mockPrisma = {
  merchantProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: { findUniqueOrThrow: jest.fn() },
  userRole: { upsert: jest.fn() },
  $transaction: jest.fn(),
};
const mockAudit = { log: jest.fn() };

describe('MerchantService', () => {
  let service: MerchantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get<MerchantService>(MerchantService);
    jest.clearAllMocks();
  });

  // ── createProfile ─────────────────────────────────────────────────────────

  describe('createProfile', () => {
    it('creates profile and assigns MERCHANT role', async () => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUniqueOrThrow.mockResolvedValue({ id: 'role-merchant' });
      const created = {
        id: 'mp-1',
        userId: 'u-1',
        businessName: 'Test Store',
        kycStatus: KycStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.merchantProfile.create.mockResolvedValue(created);
      mockPrisma.userRole.upsert.mockResolvedValue({});
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.createProfile('u-1', { businessName: 'Test Store' });

      expect(mockPrisma.merchantProfile.create).toHaveBeenCalled();
      expect(mockPrisma.userRole.upsert).toHaveBeenCalled();
      expect(result.businessName).toBe('Test Store');
    });

    it('throws ConflictException if profile already exists', async () => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue({ id: 'mp-1' });

      await expect(
        service.createProfile('u-1', { businessName: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── getProfile ────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns the profile', async () => {
      const profile = { id: 'mp-1', userId: 'u-1', businessName: 'My Store' };
      mockPrisma.merchantProfile.findUnique.mockResolvedValue(profile);

      const result = await service.getProfile('u-1');
      expect(result.id).toBe('mp-1');
    });

    it('throws NotFoundException when profile missing', async () => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('u-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── requireMerchantProfile ────────────────────────────────────────────────

  describe('requireMerchantProfile', () => {
    it('throws ForbiddenException when no profile', async () => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue(null);

      await expect(service.requireMerchantProfile('u-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
