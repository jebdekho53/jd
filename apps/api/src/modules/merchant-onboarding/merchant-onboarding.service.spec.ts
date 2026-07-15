import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MerchantApplicationStatus, MerchantOnboardingStepKey } from '@prisma/client';
import { MerchantOnboardingService } from './merchant-onboarding.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { StoreService } from '../store/store.service';
import { AdminStoreService } from '../admin/admin-store.service';
import { AuditService } from '../audit/audit.service';
import { MerchantApplicationRiskService } from './merchant-application-risk.service';
import { RiskEngineService } from '../trust-safety/risk-engine.service';
import { MarketingEventService } from '../crm/marketing-event.service';
import { SupportTicketService } from '../support/support-ticket.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { PasswordService } from '../auth/password.service';
import { LocationDirectoryService } from '../location-directory/location-directory.service';
import { GeoService } from '../geo/geo.service';
import { GeocodingCacheService } from '../geocoding/geocoding-cache.service';
import { VerticalService } from '../store-vertical/vertical.service';
import { FranchiseService } from '../franchise/franchise.service';

const LOGO = 'https://cdn.example.com/logo.jpg';
const BANNER = 'https://cdn.example.com/banner.jpg';

const COMPLETE_APP = {
  id: 'app-1',
  userId: 'u-1',
  status: MerchantApplicationStatus.DRAFT,
  storeId: null,
  ownerName: 'Owner',
  ownerEmail: 'owner@test.com',
  ownerPhone: '+919876543210',
  businessName: 'Biz',
  businessType: 'GROCERY',
  panNumber: 'ABCDE1234F',
  storeName: 'Store',
  storeAddress: '123 Street',
  pickupAddress: {
    addressLine1: '123 Street',
    locality: 'Connaught Place',
    landmark: 'Near Metro',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6,
    longitude: 77.2,
  },
  cityId: 'city-1',
  state: 'Delhi',
  city: 'New Delhi',
  pincode: '110001',
  locality: 'Connaught Place',
  latitude: 28.6,
  longitude: 77.2,
  storeLogoUrl: LOGO,
  storeBannerUrl: BANNER,
  documents: [{ id: 'd1' }, { id: 'd2' }],
  bankAccount: { accountNumber: '123' },
  steps: [],
  riskScore: 0,
  riskFlags: null,
};

const mockPrisma = {
  merchantApplication: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  merchantOnboardingStep: { update: jest.fn(), upsert: jest.fn() },
  merchantBankAccount: { upsert: jest.fn() },
  merchantProfile: { findUnique: jest.fn(), update: jest.fn() },
  merchantKyc: { update: jest.fn() },
  store: { update: jest.fn() },
  storeVerificationDocument: { create: jest.fn() },
  user: { update: jest.fn() },
  $transaction: jest.fn(),
};

const mockMerchant = {
  getProfile: jest.fn(),
  createProfile: jest.fn(),
  ensureMerchantRole: jest.fn(),
};
const mockStore = {
  createStore: jest.fn(),
  submitForReview: jest.fn(),
};
const mockRisk = { assess: jest.fn() };
const mockRiskEngine = { getOrCreateProfile: jest.fn() };
const mockLocations = { tryResolvePincode: jest.fn() };
const mockGeo = { findOrCreateOperationalCity: jest.fn() };
const mockGeocoding = { isConfigured: jest.fn(), reverseGeocode: jest.fn() };
const mockVertical = {
  ensureStoreVerticalProfile: jest.fn(),
  ensureStoreBusinessTypesFromApplication: jest.fn(),
};
const mockSupportTickets = { createTicket: jest.fn().mockResolvedValue({}) };
const mockMarketingEvents = { track: jest.fn() };
const mockAudit = { log: jest.fn() };
const mockEmailNotifications = {
  sendWelcomeEmail: jest.fn(),
  sendMerchantWelcomeEmail: jest.fn(),
  sendMerchantApplicationReceived: jest.fn(),
  sendAdminNewMerchantApplication: jest.fn(),
};

describe('MerchantOnboardingService branding', () => {
  let service: MerchantOnboardingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantOnboardingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantService, useValue: mockMerchant },
        { provide: StoreService, useValue: mockStore },
        { provide: AdminStoreService, useValue: {} },
        { provide: AuditService, useValue: mockAudit },
        { provide: MerchantApplicationRiskService, useValue: mockRisk },
        { provide: RiskEngineService, useValue: mockRiskEngine },
        { provide: MarketingEventService, useValue: mockMarketingEvents },
        { provide: SupportTicketService, useValue: mockSupportTickets },
        { provide: EmailNotificationService, useValue: mockEmailNotifications },
        { provide: PasswordService, useValue: { hash: jest.fn() } },
        { provide: LocationDirectoryService, useValue: mockLocations },
        { provide: GeoService, useValue: mockGeo },
        { provide: GeocodingCacheService, useValue: mockGeocoding },
        { provide: VerticalService, useValue: mockVertical },
        { provide: FranchiseService, useValue: { linkStore: jest.fn() } },
      ],
    }).compile();

    service = module.get(MerchantOnboardingService);
    jest.clearAllMocks();
    mockPrisma.merchantApplication.findFirst.mockResolvedValue(COMPLETE_APP);
    mockPrisma.merchantApplication.update.mockResolvedValue(COMPLETE_APP);
    mockPrisma.merchantOnboardingStep.upsert.mockResolvedValue({});
    mockPrisma.merchantBankAccount.upsert.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => unknown) =>
      fn(mockPrisma),
    );
    mockRisk.assess.mockResolvedValue({ riskScore: 10, riskFlags: [] });
    mockRiskEngine.getOrCreateProfile.mockResolvedValue({});
    mockStore.createStore.mockResolvedValue({ id: 'store-1' });
    mockStore.submitForReview.mockResolvedValue({});
    mockMerchant.getProfile.mockResolvedValue({ id: 'mp-1' });
    mockMerchant.createProfile.mockResolvedValue({ id: 'mp-1' });
    mockMerchant.ensureMerchantRole.mockResolvedValue(undefined);
    mockPrisma.merchantKyc.update.mockResolvedValue({});
    mockPrisma.merchantProfile.update.mockResolvedValue({});
    mockPrisma.merchantOnboardingStep.update.mockResolvedValue({});
    mockMarketingEvents.track.mockResolvedValue(undefined);
    mockAudit.log.mockResolvedValue(undefined);
  });

  describe('updateStep', () => {
    it.each([
      MerchantOnboardingStepKey.VERIFY,
      MerchantOnboardingStepKey.BUSINESS,
      MerchantOnboardingStepKey.STORE,
      MerchantOnboardingStepKey.LOCATION,
      MerchantOnboardingStepKey.DELIVERY,
      MerchantOnboardingStepKey.CATEGORIES,
      MerchantOnboardingStepKey.GST_PAN,
      MerchantOnboardingStepKey.BANK,
      MerchantOnboardingStepKey.REVIEW,
    ])('accepts wizard step %s', async (stepKey) => {
      await service.updateStep('u-1', { stepKey });

      expect(mockPrisma.merchantOnboardingStep.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { applicationId_stepKey: { applicationId: COMPLETE_APP.id, stepKey } },
        }),
      );
    });

    it.each([
      [MerchantOnboardingStepKey.PERSONAL_DETAILS, MerchantOnboardingStepKey.VERIFY],
      [MerchantOnboardingStepKey.BUSINESS_DETAILS, MerchantOnboardingStepKey.BUSINESS],
      [MerchantOnboardingStepKey.STORE_DETAILS, MerchantOnboardingStepKey.STORE],
      [MerchantOnboardingStepKey.DOCUMENTS, MerchantOnboardingStepKey.GST_PAN],
      [MerchantOnboardingStepKey.BANK_DETAILS, MerchantOnboardingStepKey.BANK],
    ])('maps legacy alias %s to %s', async (alias, canonical) => {
      await service.updateStep('u-1', { stepKey: alias });

      expect(mockPrisma.merchantOnboardingStep.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { applicationId_stepKey: { applicationId: COMPLETE_APP.id, stepKey: canonical } },
        }),
      );
      expect(mockPrisma.merchantOnboardingStep.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { applicationId_stepKey: { applicationId: COMPLETE_APP.id, stepKey: alias } },
        }),
      );
    });

    it('persists storeLogoUrl and storeBannerUrl on STORE_DETAILS', async () => {
      mockPrisma.merchantApplication.update.mockResolvedValue({
        ...COMPLETE_APP,
        storeLogoUrl: LOGO,
        storeBannerUrl: BANNER,
        documents: [],
        bankAccount: null,
        steps: [],
      });

      await service.updateStep('u-1', {
        stepKey: MerchantOnboardingStepKey.STORE_DETAILS,
        storeLogoUrl: LOGO,
        storeBannerUrl: BANNER,
      });

      expect(mockPrisma.merchantApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storeLogoUrl: LOGO,
            storeBannerUrl: BANNER,
          }),
        }),
      );
    });

    it('merges partial step payloads without clearing previous store fields', async () => {
      await service.updateStep('u-1', {
        stepKey: MerchantOnboardingStepKey.STORE,
        storeName: 'QA Grocery Dairy Store',
      });

      expect(mockPrisma.merchantApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ storeName: 'QA Grocery Dairy Store' }),
        }),
      );

      mockPrisma.merchantApplication.update.mockClear();

      await service.updateStep('u-1', {
        stepKey: MerchantOnboardingStepKey.DELIVERY,
        deliveryRadiusKm: 5,
      });

      expect(mockPrisma.merchantApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ storeName: expect.anything() }),
        }),
      );
      expect(mockPrisma.merchantApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deliveryRadiusKm: 5 }),
        }),
      );
    });

    it('validates the full application only on REVIEW', async () => {
      mockPrisma.merchantApplication.update.mockResolvedValue({
        ...COMPLETE_APP,
        storeName: null,
      });

      await expect(
        service.updateStep('u-1', { stepKey: MerchantOnboardingStepKey.DELIVERY, deliveryRadiusKm: 5 }),
      ).resolves.toBeDefined();

      await expect(
        service.updateStep('u-1', { stepKey: MerchantOnboardingStepKey.REVIEW }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitApplication', () => {
    beforeEach(() => {
      mockMerchant.createProfile.mockResolvedValue({ id: 'mp-1' });
      mockStore.createStore.mockResolvedValue({ id: 's-1' });
      mockStore.submitForReview.mockResolvedValue({});
      mockPrisma.merchantKyc.update.mockResolvedValue({});
      mockPrisma.merchantProfile.update.mockResolvedValue({});
      mockPrisma.merchantOnboardingStep.update.mockResolvedValue({});
      mockPrisma.merchantApplication.update.mockResolvedValue({
        ...COMPLETE_APP,
        status: MerchantApplicationStatus.SUBMITTED,
        documents: COMPLETE_APP.documents,
        bankAccount: COMPLETE_APP.bankAccount,
        steps: [],
      });
    });

    it('passes logo and banner into createStore', async () => {
      await service.submitApplication('u-1');

      expect(mockStore.createStore).toHaveBeenCalledWith(
        'u-1',
        expect.objectContaining({
          logoUrl: LOGO,
          bannerUrl: BANNER,
        }),
        undefined,
      );
    });

    it('rejects when store branding is missing', async () => {
      mockPrisma.merchantApplication.findFirst.mockResolvedValue({
        ...COMPLETE_APP,
        storeLogoUrl: null,
        storeBannerUrl: null,
      });

      await expect(service.submitApplication('u-1')).rejects.toThrow(BadRequestException);
      expect(mockStore.createStore).not.toHaveBeenCalled();
    });
  });

  describe('submitApplication', () => {
    it('creates merchant application workflow updates without opening a support ticket', async () => {
      await service.submitApplication('u-1', '127.0.0.1');

      expect(mockStore.createStore).toHaveBeenCalled();
      expect(mockPrisma.merchantApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            merchantProfileId: 'mp-1',
            storeId: 'store-1',
          }),
        }),
      );
      expect(mockSupportTickets.createTicket).not.toHaveBeenCalled();
    });
  });
});
