import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  KycStatus,
  MarketingEventType,
  MerchantApplicationStatus,
  MerchantDocumentType,
  MerchantKycStatus,
  MerchantOnboardingStepKey,
  Prisma,
  RejectionType,
  StoreDocumentType,
  StoreStatus,
  SupportActorType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MerchantService } from '../merchant/merchant.service';
import { StoreService } from '../store/store.service';
import { AdminStoreService } from '../admin/admin-store.service';
import { isValidGstin, normalizeGstin } from '../compliance/gst-validation.util';
import { MarketingEventService } from '../crm/marketing-event.service';
import { RiskEngineService } from '../trust-safety/risk-engine.service';
import { SupportTicketService } from '../support/support-ticket.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { PasswordService } from '../auth/password.service';
import { MerchantApplicationRiskService } from './merchant-application-risk.service';
import {
  FranchiseLeadDto,
  ListMerchantApplicationsDto,
  RejectApplicationDto,
  RequestApplicationChangesDto,
  RequestApplicationDocumentsDto,
  SaveBankAccountDto,
  ScheduleCallDto,
  UpdateOnboardingStepDto,
  UploadMerchantDocumentDto,
} from './dto/merchant-onboarding.dto';
import { CreateStoreDto } from '../store/dto/create-store.dto';

const DOC_TO_STORE: Partial<Record<MerchantDocumentType, StoreDocumentType>> = {
  GST_CERTIFICATE: StoreDocumentType.GST_CERTIFICATE,
  PAN_CARD: StoreDocumentType.PAN_CARD,
  SHOP_LICENSE: StoreDocumentType.TRADE_LICENSE,
  FSSAI_LICENSE: StoreDocumentType.FSSAI_LICENSE,
  CANCELLED_CHEQUE: StoreDocumentType.BANK_PROOF,
  TRADE_LICENSE: StoreDocumentType.TRADE_LICENSE,
  BANK_PROOF: StoreDocumentType.BANK_PROOF,
  OWNER_PHOTO: StoreDocumentType.OTHER,
  STORE_PHOTO: StoreDocumentType.OTHER,
  OTHER: StoreDocumentType.OTHER,
};

const ALL_STEPS: MerchantOnboardingStepKey[] = [
  MerchantOnboardingStepKey.PERSONAL_DETAILS,
  MerchantOnboardingStepKey.BUSINESS_DETAILS,
  MerchantOnboardingStepKey.STORE_DETAILS,
  MerchantOnboardingStepKey.DOCUMENTS,
  MerchantOnboardingStepKey.BANK_DETAILS,
  MerchantOnboardingStepKey.REVIEW,
];

@Injectable()
export class MerchantOnboardingService {
  private readonly logger = new Logger(MerchantOnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly storeService: StoreService,
    private readonly adminStoreService: AdminStoreService,
    private readonly audit: AuditService,
    private readonly riskService: MerchantApplicationRiskService,
    private readonly riskEngine: RiskEngineService,
    private readonly marketingEvents: MarketingEventService,
    private readonly supportTickets: SupportTicketService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly passwordService: PasswordService,
  ) {}

  async getPublicStats() {
    const [customers, orders, cities, merchants] = await Promise.all([
      this.prisma.user.count({ where: { buyerProfile: { isNot: null }, deletedAt: null } }),
      this.prisma.order.count({ where: { status: { in: ['DELIVERED', 'COMPLETED'] } } }),
      this.prisma.city.count({ where: { isActive: true } }),
      this.prisma.merchantProfile.count({ where: { isBlacklisted: false } }),
    ]);

    return {
      activeCustomers: customers,
      ordersDelivered: orders,
      citiesServed: cities,
      merchantPartners: merchants,
    };
  }

  async getOrCreateApplication(userId: string) {
    const existing = await this.prisma.merchantApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: this.applicationInclude(),
    });

    if (existing) return this.formatApplication(existing);

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const app = await this.prisma.merchantApplication.create({
      data: {
        userId,
        ownerEmail: user.email,
        ownerPhone: user.phone,
        steps: {
          create: ALL_STEPS.map((stepKey) => ({ stepKey, completed: false })),
        },
        kyc: { create: {} },
      },
      include: this.applicationInclude(),
    });

    await this.marketingEvents.track({
      userId,
      eventType: MarketingEventType.MERCHANT_SIGNUP,
      metadata: { source: 'merchant_onboarding' },
    });

    await this.riskEngine.getOrCreateProfile(userId);
    return this.formatApplication(app);
  }

  async updateStep(userId: string, dto: UpdateOnboardingStepDto, ipAddress?: string) {
    const app = await this.requireDraftApplication(userId);
    const data: Prisma.MerchantApplicationUpdateInput = {};

    if (dto.ownerName) data.ownerName = dto.ownerName;
    if (dto.ownerEmail) data.ownerEmail = dto.ownerEmail.trim().toLowerCase();
    if (dto.ownerPhone) data.ownerPhone = dto.ownerPhone;
    if (dto.businessName) data.businessName = dto.businessName;
    if (dto.businessType) data.businessType = dto.businessType;
    if (dto.gstNumber) {
      const gst = normalizeGstin(dto.gstNumber);
      data.gstNumber = gst;
      data.gstVerified = isValidGstin(gst);
    }
    if (dto.panNumber) data.panNumber = dto.panNumber.toUpperCase();
    if (dto.storeName) data.storeName = dto.storeName;
    if (dto.storeAddress) data.storeAddress = dto.storeAddress;
    if (dto.state) data.state = dto.state;
    if (dto.city) data.city = dto.city;
    if (dto.cityId) data.cityId = dto.cityId;
    if (dto.pincode) data.pincode = dto.pincode;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.deliveryRadiusKm !== undefined) data.deliveryRadiusKm = dto.deliveryRadiusKm;

    if (dto.password && dto.ownerEmail) {
      const passwordHash = await this.passwordService.hash(dto.password);
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, email: dto.ownerEmail.trim().toLowerCase(), emailVerified: true },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.merchantApplication.update({
        where: { id: app.id },
        data,
        include: this.applicationInclude(),
      });

      await tx.merchantOnboardingStep.update({
        where: { applicationId_stepKey: { applicationId: app.id, stepKey: dto.stepKey } },
        data: { completed: true, completedAt: new Date() },
      });

      return result;
    });

    if (dto.stepKey === MerchantOnboardingStepKey.BUSINESS_DETAILS && dto.businessName && dto.panNumber) {
      try {
        await this.merchantService.getProfile(userId);
      } catch {
        await this.merchantService.createProfile(
          userId,
          {
            businessName: dto.businessName,
            gstNumber: dto.gstNumber,
            panNumber: dto.panNumber!,
          },
          ipAddress,
        );
      }
    }

    const risk = await this.riskService.assess({
      userId,
      applicationId: app.id,
      ownerPhone: updated.ownerPhone,
      ownerEmail: updated.ownerEmail,
      gstNumber: updated.gstNumber,
      panNumber: updated.panNumber,
      accountNumber: updated.bankAccount?.accountNumber,
    });

    const withRisk = await this.prisma.merchantApplication.update({
      where: { id: app.id },
      data: {
        riskScore: risk.riskScore,
        riskFlags: risk.riskFlags,
      },
      include: this.applicationInclude(),
    });

    return this.formatApplication(withRisk);
  }

  validateGst(gstNumber: string) {
    const normalized = normalizeGstin(gstNumber);
    const valid = isValidGstin(normalized);
    return { gstNumber: normalized, valid, message: valid ? 'GST verified' : 'GST invalid' };
  }

  async uploadDocument(userId: string, dto: UploadMerchantDocumentDto) {
    const app = await this.requireDraftApplication(userId);
    const existing = await this.prisma.merchantDocument.findFirst({
      where: { applicationId: app.id, documentType: dto.documentType },
    });

    if (existing) {
      await this.prisma.merchantDocument.update({
        where: { id: existing.id },
        data: {
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          mimeType: dto.mimeType,
          uploadedAt: new Date(),
        },
      });
    } else {
      await this.prisma.merchantDocument.create({
        data: {
          applicationId: app.id,
          documentType: dto.documentType,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          mimeType: dto.mimeType,
        },
      });
    }

    await this.prisma.merchantOnboardingStep.update({
      where: {
        applicationId_stepKey: {
          applicationId: app.id,
          stepKey: MerchantOnboardingStepKey.DOCUMENTS,
        },
      },
      data: { completed: true, completedAt: new Date() },
    });

    return this.getOrCreateApplication(userId);
  }

  async saveBankAccount(userId: string, dto: SaveBankAccountDto) {
    const app = await this.requireDraftApplication(userId);
    await this.prisma.merchantBankAccount.upsert({
      where: { applicationId: app.id },
      create: {
        applicationId: app.id,
        accountHolderName: dto.accountHolderName,
        accountNumber: dto.accountNumber,
        ifsc: dto.ifsc.toUpperCase(),
        upiId: dto.upiId,
        bankName: dto.bankName,
      },
      update: {
        accountHolderName: dto.accountHolderName,
        accountNumber: dto.accountNumber,
        ifsc: dto.ifsc.toUpperCase(),
        upiId: dto.upiId,
        bankName: dto.bankName,
      },
    });

    await this.prisma.merchantOnboardingStep.update({
      where: {
        applicationId_stepKey: {
          applicationId: app.id,
          stepKey: MerchantOnboardingStepKey.BANK_DETAILS,
        },
      },
      data: { completed: true, completedAt: new Date() },
    });

    return this.getOrCreateApplication(userId);
  }

  async submitApplication(userId: string, ipAddress?: string) {
    const app = await this.requireDraftApplication(userId);
    this.assertSubmissionReady(app);

    let profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.merchantService.createProfile(
        userId,
        {
          businessName: app.businessName!,
          gstNumber: app.gstNumber ?? undefined,
          panNumber: app.panNumber!,
        },
        ipAddress,
      );
    }

    let storeId = app.storeId;
    if (!storeId) {
      const storeDto: CreateStoreDto = {
        name: app.storeName!,
        phone: app.ownerPhone!,
        email: app.ownerEmail!,
        line1: app.storeAddress!,
        pincode: app.pincode!,
        latitude: app.latitude!,
        longitude: app.longitude!,
        cityId: app.cityId!,
      };
      const store = await this.storeService.createStore(userId, storeDto, ipAddress);
      storeId = store.id;

      if (app.deliveryRadiusKm) {
        await this.prisma.store.update({
          where: { id: storeId },
          data: { deliveryRadiusKm: app.deliveryRadiusKm },
        });
      }

      for (const doc of app.documents) {
        const storeDocType = DOC_TO_STORE[doc.documentType] ?? StoreDocumentType.OTHER;
        await this.prisma.storeVerificationDocument.create({
          data: {
            storeId,
            documentType: storeDocType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            mimeType: doc.mimeType,
            uploadedBy: userId,
          },
        });
      }
    }

    await this.storeService.submitForReview(userId, storeId, ipAddress);

    const risk = await this.riskService.assess({
      userId,
      applicationId: app.id,
      ownerPhone: app.ownerPhone,
      ownerEmail: app.ownerEmail,
      gstNumber: app.gstNumber,
      panNumber: app.panNumber,
      accountNumber: app.bankAccount?.accountNumber,
    });

    const status =
      risk.riskScore >= 50
        ? MerchantApplicationStatus.KYC_PENDING
        : MerchantApplicationStatus.SUBMITTED;

    const updated = await this.prisma.merchantApplication.update({
      where: { id: app.id },
      data: {
        status,
        merchantProfileId: profile.id,
        storeId,
        submittedAt: new Date(),
        riskScore: risk.riskScore,
        riskFlags: risk.riskFlags,
      },
      include: this.applicationInclude(),
    });

    await this.prisma.merchantKyc.update({
      where: { applicationId: app.id },
      data: { status: MerchantKycStatus.SUBMITTED },
    });

    await this.prisma.merchantProfile.update({
      where: { id: profile.id },
      data: { kycStatus: KycStatus.SUBMITTED },
    });

    await this.prisma.merchantOnboardingStep.update({
      where: {
        applicationId_stepKey: {
          applicationId: app.id,
          stepKey: MerchantOnboardingStepKey.REVIEW,
        },
      },
      data: { completed: true, completedAt: new Date() },
    });

    await Promise.all([
      this.marketingEvents.track({
        userId,
        eventType: MarketingEventType.MERCHANT_APPLICATION_SUBMITTED,
        storeId,
        metadata: { applicationId: app.id, riskScore: risk.riskScore },
      }),
      this.supportTickets.createTicket(
        {
          requesterUserId: userId,
          actorType: SupportActorType.MERCHANT,
          categoryCode: 'MERCHANT_ONBOARDING',
          subject: `New merchant application: ${app.businessName}`,
          description: `Store application submitted for ${app.storeName}. Risk score: ${risk.riskScore}.`,
          channel: 'IN_APP',
        },
        ipAddress,
      ),
      this.sendSubmissionNotifications(userId, app.ownerEmail, app.ownerPhone, app.businessName!),
      this.audit.log({
        actorId: userId,
        action: 'MERCHANT_APPLICATION_SUBMITTED',
        resourceType: 'merchant_application',
        resourceId: app.id,
        ipAddress,
        metadata: { storeId, riskScore: risk.riskScore } as Prisma.InputJsonValue,
      }),
    ]);

    return this.formatApplication(updated);
  }

  async getApplicationStatus(userId: string) {
    const app = await this.prisma.merchantApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { store: { select: { status: true, id: true, name: true } } },
    });

    if (!app) {
      return { hasApplication: false, tracker: [] };
    }

    const storeStatus = app.store?.status;
    const tracker = [
      { key: 'submitted', label: 'Application Submitted', done: Boolean(app.submittedAt) },
      {
        key: 'documents',
        label: 'Documents Verified',
        done: storeStatus === StoreStatus.UNDER_REVIEW || storeStatus === StoreStatus.APPROVED,
      },
      {
        key: 'kyc',
        label: 'KYC Review',
        done:
          app.status === MerchantApplicationStatus.APPROVED ||
          storeStatus === StoreStatus.UNDER_REVIEW,
      },
      {
        key: 'store',
        label: 'Store Approval',
        done: storeStatus === StoreStatus.APPROVED,
      },
      { key: 'live', label: 'Live On Platform', done: storeStatus === StoreStatus.APPROVED },
    ];

    return {
      hasApplication: true,
      applicationId: app.id,
      status: app.status,
      storeStatus,
      riskScore: app.riskScore,
      tracker,
      progressPct: Math.round((tracker.filter((t) => t.done).length / tracker.length) * 100),
    };
  }

  async getPostApprovalChecklist(userId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: {
        stores: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            _count: { select: { products: true } },
          },
        },
      },
    });

    const store = profile?.stores[0];
    if (!store || store.status !== StoreStatus.APPROVED) {
      return { items: [], progressPct: 0 };
    }

    const items = [
      { key: 'logo', label: 'Upload Logo', done: Boolean(store.logoUrl) },
      { key: 'products', label: 'Add Products', done: store._count.products > 0 },
      { key: 'inventory', label: 'Configure Inventory', done: store._count.products > 0 },
      {
        key: 'radius',
        label: 'Configure Delivery Radius',
        done: store.deliveryRadiusKm > 0,
      },
      { key: 'gst', label: 'Configure GST', done: Boolean(profile?.gstNumber) },
      { key: 'hours', label: 'Configure Store Hours', done: true },
      { key: 'campaign', label: 'Create First Campaign', done: false },
    ];

    const done = items.filter((i) => i.done).length;
    return { items, progressPct: Math.round((done / items.length) * 100) };
  }

  async submitFranchiseLead(userId: string, dto: FranchiseLeadDto) {
    await this.supportTickets.createTicket({
      requesterUserId: userId,
      actorType: SupportActorType.MERCHANT,
      categoryCode: 'MERCHANT_ONBOARDING',
      subject: `Franchise lead: ${dto.city}`,
      description: `Contact: ${dto.contactName}\nCity: ${dto.city}\n${dto.message ?? ''}`,
      channel: 'IN_APP',
    });
    return { success: true, message: 'Franchise interest recorded. Our team will contact you.' };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listApplications(dto: ListMerchantApplicationsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.MerchantApplicationWhereInput = {};

    if (dto.status) {
      where.status = dto.status as MerchantApplicationStatus;
    } else {
      where.status = {
        in: [
          MerchantApplicationStatus.SUBMITTED,
          MerchantApplicationStatus.UNDER_REVIEW,
          MerchantApplicationStatus.KYC_PENDING,
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.merchantApplication.findMany({
        where,
        include: this.applicationInclude(),
        orderBy: { submittedAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.merchantApplication.count({ where }),
    ]);

    return { applications: items.map((a) => this.formatApplication(a)), total };
  }

  async getApplication(id: string) {
    const app = await this.prisma.merchantApplication.findUnique({
      where: { id },
      include: this.applicationInclude(),
    });
    if (!app) throw new NotFoundException('Application not found');
    return this.formatApplication(app);
  }

  async approveApplication(adminId: string, id: string, ip?: string) {
    const app = await this.prisma.merchantApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    if (!app.storeId) throw new BadRequestException('Application has no linked store');

    await this.adminStoreService.approveStore(adminId, app.storeId, ip);

    const updated = await this.prisma.merchantApplication.update({
      where: { id },
      data: {
        status: MerchantApplicationStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
      include: this.applicationInclude(),
    });

    await this.prisma.merchantKyc.update({
      where: { applicationId: id },
      data: { status: MerchantKycStatus.VERIFIED, verifiedAt: new Date(), verifiedBy: adminId },
    });

    if (app.merchantProfileId) {
      await this.prisma.merchantProfile.update({
        where: { id: app.merchantProfileId },
        data: { kycStatus: KycStatus.APPROVED },
      });
    }

    await this.marketingEvents.track({
      userId: app.userId,
      eventType: MarketingEventType.MERCHANT_APPROVED,
      storeId: app.storeId,
      metadata: { applicationId: id },
    });

    if (app.ownerEmail) {
      void this.emailNotifications.sendWelcomeEmail(app.ownerEmail, app.ownerName ?? 'Partner');
    }

    return this.formatApplication(updated);
  }

  async rejectApplication(adminId: string, id: string, dto: RejectApplicationDto, ip?: string) {
    const app = await this.prisma.merchantApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    if (app.storeId) {
      await this.adminStoreService.rejectStore(
        adminId,
        app.storeId,
        { reason: dto.reason, rejectionType: RejectionType.COMPLIANCE_ISSUE },
        ip,
      );
    }

    const updated = await this.prisma.merchantApplication.update({
      where: { id },
      data: {
        status: MerchantApplicationStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
      include: this.applicationInclude(),
    });

    return this.formatApplication(updated);
  }

  async requestDocuments(
    adminId: string,
    id: string,
    dto: RequestApplicationDocumentsDto,
    ip?: string,
  ) {
    const app = await this.prisma.merchantApplication.findUnique({ where: { id } });
    if (!app?.storeId) throw new BadRequestException('Application has no linked store');

    const storeDocTypes = dto.documentTypes.map(
      (t) => DOC_TO_STORE[t] ?? StoreDocumentType.OTHER,
    );

    await this.adminStoreService.requestDocuments(
      adminId,
      app.storeId,
      { reason: dto.reason, documentTypes: storeDocTypes },
      ip,
    );

    const updated = await this.prisma.merchantApplication.update({
      where: { id },
      data: { status: MerchantApplicationStatus.KYC_PENDING, adminNotes: dto.reason },
      include: this.applicationInclude(),
    });

    return this.formatApplication(updated);
  }

  async requestChanges(adminId: string, id: string, dto: RequestApplicationChangesDto) {
    const updated = await this.prisma.merchantApplication.update({
      where: { id },
      data: {
        status: MerchantApplicationStatus.UNDER_REVIEW,
        adminNotes: dto.message,
        reviewedBy: adminId,
      },
      include: this.applicationInclude(),
    });
    return this.formatApplication(updated);
  }

  async scheduleCall(adminId: string, id: string, dto: ScheduleCallDto) {
    const app = await this.prisma.merchantApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    await this.supportTickets.createTicket({
      requesterUserId: app.userId,
      actorType: SupportActorType.MERCHANT,
      categoryCode: 'MERCHANT_ONBOARDING',
      subject: 'Onboarding call scheduled',
      description: dto.notes,
      channel: 'PHONE',
    });

    const updated = await this.prisma.merchantApplication.update({
      where: { id },
      data: { adminNotes: `Call scheduled: ${dto.notes}`, reviewedBy: adminId },
      include: this.applicationInclude(),
    });

    return this.formatApplication(updated);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private applicationInclude() {
    return {
      documents: true,
      kyc: true,
      bankAccount: true,
      steps: { orderBy: { stepKey: 'asc' as const } },
      store: { select: { id: true, name: true, status: true } },
      merchantProfile: {
        select: { id: true, businessName: true, kycStatus: true, isBlacklisted: true },
      },
    } satisfies Prisma.MerchantApplicationInclude;
  }

  private async requireDraftApplication(userId: string) {
    const app = await this.prisma.merchantApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: this.applicationInclude(),
    });

    if (!app) throw new NotFoundException('No application found. Start onboarding first.');
    if (
      app.status !== MerchantApplicationStatus.DRAFT &&
      app.status !== MerchantApplicationStatus.REJECTED
    ) {
      throw new ConflictException(`Application cannot be edited in status: ${app.status}`);
    }
    return app;
  }

  private assertSubmissionReady(
    app: Prisma.MerchantApplicationGetPayload<{ include: ReturnType<MerchantOnboardingService['applicationInclude']> }>,
  ) {
    const missing: string[] = [];
    if (!app.ownerName) missing.push('ownerName');
    if (!app.ownerPhone) missing.push('ownerPhone');
    if (!app.ownerEmail) missing.push('ownerEmail');
    if (!app.businessName) missing.push('businessName');
    if (!app.businessType) missing.push('businessType');
    if (!app.panNumber) missing.push('panNumber');
    if (!app.storeName) missing.push('storeName');
    if (!app.storeAddress) missing.push('storeAddress');
    if (!app.cityId) missing.push('cityId');
    if (!app.pincode) missing.push('pincode');
    if (app.latitude == null) missing.push('latitude');
    if (app.longitude == null) missing.push('longitude');
    if (!app.bankAccount) missing.push('bankAccount');
    if (app.documents.length < 2) missing.push('documents');

    if (missing.length) {
      throw new BadRequestException(`Application incomplete: ${missing.join(', ')}`);
    }
  }

  private formatApplication(
    app: Prisma.MerchantApplicationGetPayload<{ include: ReturnType<MerchantOnboardingService['applicationInclude']> }>,
  ) {
    return {
      id: app.id,
      status: app.status,
      ownerName: app.ownerName,
      ownerEmail: app.ownerEmail,
      ownerPhone: app.ownerPhone,
      businessName: app.businessName,
      businessType: app.businessType,
      gstNumber: app.gstNumber,
      gstVerified: app.gstVerified,
      panNumber: app.panNumber,
      storeName: app.storeName,
      storeAddress: app.storeAddress,
      state: app.state,
      city: app.city,
      cityId: app.cityId,
      pincode: app.pincode,
      latitude: app.latitude,
      longitude: app.longitude,
      deliveryRadiusKm: app.deliveryRadiusKm,
      riskScore: app.riskScore,
      riskFlags: app.riskFlags,
      rejectionReason: app.rejectionReason,
      adminNotes: app.adminNotes,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      documents: app.documents,
      kyc: app.kyc,
      bankAccount: app.bankAccount,
      steps: app.steps,
      store: app.store,
      merchantProfile: app.merchantProfile,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  private async sendSubmissionNotifications(
    userId: string,
    email: string | null,
    _phone: string | null,
    businessName: string,
  ) {
    if (email) {
      void this.emailNotifications.sendWelcomeEmail(email, businessName);
    }
    this.logger.log({ userId, businessName }, 'Merchant application submitted — SMS/WhatsApp via CRM orchestrator');
  }
}
