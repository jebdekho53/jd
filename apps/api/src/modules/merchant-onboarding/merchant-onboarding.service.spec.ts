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
  cityId: 'city-1',
  pincode: '110001',
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
  merchantOnboardingStep: { update: jest.fn() },
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
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: MerchantApplicationRiskService, useValue: mockRisk },
        { provide: RiskEngineService, useValue: mockRiskEngine },
        { provide: MarketingEventService, useValue: { track: jest.fn() } },
        { provide: SupportTicketService, useValue: { createTicket: jest.fn().mockResolvedValue({}) } },
        { provide: EmailNotificationService, useValue: { sendWelcomeEmail: jest.fn() } },
        { provide: PasswordService, useValue: { hash: jest.fn() } },
      ],
    }).compile();

    service = module.get(MerchantOnboardingService);
    jest.clearAllMocks();
    mockPrisma.merchantApplication.findFirst.mockResolvedValue(COMPLETE_APP);
    mockRisk.assess.mockResolvedValue({ riskScore: 10, riskFlags: [] });
    mockRiskEngine.getOrCreateProfile.mockResolvedValue({});
  });

  describe('updateStep', () => {
    it('persists storeLogoUrl and storeBannerUrl on STORE_DETAILS', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => unknown) =>
        fn(mockPrisma),
      );
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
});
