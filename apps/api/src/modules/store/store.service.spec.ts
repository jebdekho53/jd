import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { StoreService } from './store.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

const MERCHANT_PROFILE = { id: 'mp-1', userId: 'u-1', businessName: 'Test' };
const MOCK_STORE_BASE = {
  id: 's-1',
  merchantProfileId: 'mp-1',
  name: 'Test Store',
  slug: 'test-store',
  status: StoreStatus.DRAFT,
  line1: '123 Street',
  pincode: '110001',
  latitude: 28.5,
  longitude: 77.2,
  cityId: 'city-1',
  phone: '+919876543210',
  email: null,
  isActive: false,
  deletedAt: null,
};

const mockPrisma = {
  merchantProfile: { findUnique: jest.fn() },
  city: { findUnique: jest.fn() },
  store: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  storeZone: { createMany: jest.fn(), deleteMany: jest.fn() },
  storeServiceArea: { createMany: jest.fn(), deleteMany: jest.fn() },
  storeHour: { upsert: jest.fn() },
  $transaction: jest.fn(),
};

const mockMerchant = { requireMerchantProfile: jest.fn() };
const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };

describe('StoreService', () => {
  let service: StoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantService, useValue: mockMerchant },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
      ],
    }).compile();
    service = module.get<StoreService>(StoreService);
    jest.clearAllMocks();
  });

  // ── createStore ───────────────────────────────────────────────────────────

  describe('createStore', () => {
    it('creates a DRAFT store', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.city.findUnique.mockResolvedValue({ id: 'city-1' });
      mockPrisma.store.findFirst.mockResolvedValue(null); // unique slug check
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.store.create.mockResolvedValue({ ...MOCK_STORE_BASE });
      mockPrisma.store.findUnique.mockResolvedValue({
        ...MOCK_STORE_BASE,
        hours: [],
        storeZones: [],
        storeServiceAreas: [],
      });
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.createStore('u-1', {
        name: 'Test Store',
        line1: '123 Street',
        pincode: '110001',
        latitude: 28.5,
        longitude: 77.2,
        cityId: 'city-1',
      });

      expect(result.status).toBe(StoreStatus.DRAFT);
      expect(mockPrisma.store.create).toHaveBeenCalled();
    });

    it('throws BadRequestException for unknown cityId', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.city.findUnique.mockResolvedValue(null);
      mockPrisma.store.findFirst.mockResolvedValue(null);

      await expect(
        service.createStore('u-1', {
          name: 'Test',
          line1: '123 St',
          pincode: '110001',
          latitude: 28.5,
          longitude: 77.2,
          cityId: 'nonexistent',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── submitForReview ───────────────────────────────────────────────────────

  describe('submitForReview', () => {
    it('transitions DRAFT → PENDING_REVIEW when ready', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      const readyStore = {
        ...MOCK_STORE_BASE,
        hours: [{ dayOfWeek: 'MONDAY', openTime: '09:00', closeTime: '22:00', isClosed: false }],
        storeZones: [{ zone: { id: 'z-1', name: 'South Delhi', slug: 'south-delhi' } }],
        storeServiceAreas: [],
      };
      mockPrisma.store.findUnique.mockResolvedValue(readyStore);
      mockPrisma.store.update.mockResolvedValue({
        ...readyStore,
        status: StoreStatus.PENDING_REVIEW,
      });
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('event-1');

      const result = await service.submitForReview('u-1', 's-1');
      expect(mockPrisma.store.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: StoreStatus.PENDING_REVIEW }),
        }),
      );
    });

    it('throws BadRequestException if store is in PENDING_REVIEW already', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findUnique.mockResolvedValue({
        ...MOCK_STORE_BASE,
        status: StoreStatus.PENDING_REVIEW,
        hours: [],
        storeZones: [],
        storeServiceAreas: [],
      });

      await expect(service.submitForReview('u-1', 's-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when required fields missing', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      const incompleteStore = {
        ...MOCK_STORE_BASE,
        phone: null,
        email: null,
        hours: [], // no hours
        storeZones: [], // no zones
        storeServiceAreas: [],
      };
      mockPrisma.store.findUnique.mockResolvedValue(incompleteStore);

      await expect(service.submitForReview('u-1', 's-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ── updateStore ───────────────────────────────────────────────────────────

  describe('updateStore', () => {
    it('blocks edits on PENDING_REVIEW stores', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findUnique.mockResolvedValue({
        ...MOCK_STORE_BASE,
        status: StoreStatus.PENDING_REVIEW,
        hours: [],
        storeZones: [],
        storeServiceAreas: [],
      });

      await expect(
        service.updateStore('u-1', 's-1', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks core-field edits on APPROVED stores', async () => {
      mockMerchant.requireMerchantProfile.mockResolvedValue(MERCHANT_PROFILE);
      mockPrisma.store.findUnique.mockResolvedValue({
        ...MOCK_STORE_BASE,
        status: StoreStatus.APPROVED,
        isActive: true,
        hours: [],
        storeZones: [],
        storeServiceAreas: [],
      });

      await expect(
        service.updateStore('u-1', 's-1', { name: 'New Name', line1: 'New addr' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
