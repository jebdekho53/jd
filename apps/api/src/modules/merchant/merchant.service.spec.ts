import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import { MerchantService } from './merchant.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VerificationBlocklistService } from './verification-blocklist.service';

const mockPrisma = {
  merchantProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: { findUniqueOrThrow: jest.fn() },
  role: { findUniqueOrThrow: jest.fn() },
  userRole: { upsert: jest.fn() },
  $transaction: jest.fn(),
};
const mockAudit = { log: jest.fn() };
const mockBlocklist = {
  assertNotBlocked: jest.fn(),
  assertUserNotBlacklisted: jest.fn(),
  assertMerchantProfileNotBlacklisted: jest.fn(),
};

const CREATE_DTO = {
  businessName: 'Test Store',
  gstNumber: '22AAAAA0000A1Z5',
  panNumber: 'ABCDE1234F',
};

describe('MerchantService', () => {
  let service: MerchantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: VerificationBlocklistService, useValue: mockBlocklist },
      ],
    }).compile();
    service = module.get<MerchantService>(MerchantService);
    jest.clearAllMocks();
  });

  // ── createProfile ─────────────────────────────────────────────────────────

  describe('createProfile', () => {
    it('creates profile and assigns MERCHANT role', async () => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        phone: '+919876543211',
        email: 'merchant@demo.jebdekho.com',
      });
      mockBlocklist.assertNotBlocked.mockResolvedValue(undefined);
      mockBlocklist.assertUserNotBlacklisted.mockResolvedValue(undefined);
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

      const result = await service.createProfile('u-1', CREATE_DTO);

      expect(mockPrisma.merchantProfile.create).toHaveBeenCalled();
      expect(mockPrisma.userRole.upsert).toHaveBeenCalled();
      expect(result.businessName).toBe('Test Store');
    });

    it('throws ConflictException if profile already exists', async () => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue({ id: 'mp-1' });

      await expect(
        service.createProfile('u-1', CREATE_DTO),
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

    it('throws when user id is missing', async () => {
      await expect(service.requireMerchantProfile('')).rejects.toThrow(ForbiddenException);
    });

    it('throws when profile userId does not match request user', async () => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue({
        id: 'mp-1',
        userId: 'other-user',
      });

      await expect(service.requireMerchantProfile('u-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns profile when owned by user', async () => {
      const profile = { id: 'mp-1', userId: 'u-1' };
      mockPrisma.merchantProfile.findUnique.mockResolvedValue(profile);

      await expect(service.requireMerchantProfile('u-1')).resolves.toEqual(profile);
    });
  });
});
