import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FranchisePartnerStatus,
  KycStatus,
  MarketingEventType,
  MerchantApplicationStatus,
  MerchantBusinessType,
  MerchantDocumentType,
  MerchantKycStatus,
  MerchantOnboardingStepKey,
  Prisma,
  RejectionType,
  StoreDocumentType,
  StoreStatus,
  SupportActorType,
  VerticalBusinessType,
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
  ResolveStoreLocationDto,
  SaveBankAccountDto,
  ScheduleCallDto,
  SetAttributionDto,
  UpdateOnboardingStepDto,
  UploadMerchantDocumentDto,
} from './dto/merchant-onboarding.dto';
import { CreateStoreDto } from '../store/dto/create-store.dto';
import { LocationDirectoryService } from '../location-directory/location-directory.service';
import { GeoService } from '../geo/geo.service';
import { GeocodingCacheService } from '../geocoding/geocoding-cache.service';
import { VerticalService } from '../store-vertical/vertical.service';
import { FranchiseService } from '../franchise/franchise.service';

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

const CANONICAL_STEPS: MerchantOnboardingStepKey[] = [
  MerchantOnboardingStepKey.VERIFY,
  MerchantOnboardingStepKey.BUSINESS,
  MerchantOnboardingStepKey.STORE,
  MerchantOnboardingStepKey.LOCATION,
  MerchantOnboardingStepKey.DELIVERY,
  MerchantOnboardingStepKey.CATEGORIES,
  MerchantOnboardingStepKey.GST_PAN,
  MerchantOnboardingStepKey.BANK,
  MerchantOnboardingStepKey.REVIEW,
];

const LEGACY_STEP_ALIASES: Partial<Record<MerchantOnboardingStepKey, MerchantOnboardingStepKey>> = {
  [MerchantOnboardingStepKey.PERSONAL_DETAILS]: MerchantOnboardingStepKey.VERIFY,
  [MerchantOnboardingStepKey.BUSINESS_DETAILS]: MerchantOnboardingStepKey.BUSINESS,
  [MerchantOnboardingStepKey.STORE_DETAILS]: MerchantOnboardingStepKey.STORE,
  [MerchantOnboardingStepKey.DOCUMENTS]: MerchantOnboardingStepKey.GST_PAN,
  [MerchantOnboardingStepKey.BANK_DETAILS]: MerchantOnboardingStepKey.BANK,
};

/** Human labels for the canonical onboarding steps, used by the admin funnel. */
const STEP_LABELS: Record<MerchantOnboardingStepKey, string> = {
  [MerchantOnboardingStepKey.VERIFY]: 'Phone / OTP verify',
  [MerchantOnboardingStepKey.BUSINESS]: 'Business details',
  [MerchantOnboardingStepKey.STORE]: 'Store setup',
  [MerchantOnboardingStepKey.LOCATION]: 'Location',
  [MerchantOnboardingStepKey.DELIVERY]: 'Delivery config',
  [MerchantOnboardingStepKey.CATEGORIES]: 'Categories',
  [MerchantOnboardingStepKey.GST_PAN]: 'GST / PAN',
  [MerchantOnboardingStepKey.BANK]: 'Bank details',
  [MerchantOnboardingStepKey.REVIEW]: 'Review & submit',
  // Legacy aliases (older applications may still carry these keys).
  [MerchantOnboardingStepKey.PERSONAL_DETAILS]: 'Phone / OTP verify',
  [MerchantOnboardingStepKey.BUSINESS_DETAILS]: 'Business details',
  [MerchantOnboardingStepKey.STORE_DETAILS]: 'Store setup',
  [MerchantOnboardingStepKey.DOCUMENTS]: 'GST / PAN',
  [MerchantOnboardingStepKey.BANK_DETAILS]: 'Bank details',
};

/** Normalize a (possibly legacy) step key to its canonical form. */
function canonicalStep(step: MerchantOnboardingStepKey): MerchantOnboardingStepKey {
  return LEGACY_STEP_ALIASES[step] ?? step;
}

type PickupAddressPayload = {
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  pickupInstructions?: string;
  googlePlaceId?: string;
  formattedAddress?: string;
};

const ALL_STEPS = CANONICAL_STEPS;

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
    private readonly locations: LocationDirectoryService,
    private readonly geo: GeoService,
    private readonly geocoding: GeocodingCacheService,
    private readonly verticalService: VerticalService,
    private readonly franchiseService: FranchiseService,
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

  /**
   * First-touch acquisition attribution (e.g. a merchant who arrived via a Meta
   * ad on merchant.jebdekho.com). Ensures the application exists, then fills only
   * the attribution fields that are still empty so the first campaign that
   * referred the merchant is the one that gets credit.
   */
  async setAttribution(userId: string, dto: SetAttributionDto) {
    if (
      !dto.utmSource &&
      !dto.utmMedium &&
      !dto.utmCampaign &&
      !dto.utmContent &&
      !dto.fbclid &&
      !dto.ref
    ) {
      return { updated: false };
    }
    await this.getOrCreateApplication(userId);
    const app = await this.prisma.merchantApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmContent: true,
        fbclid: true,
        franchiseId: true,
        referralCode: true,
      },
    });
    if (!app) return { updated: false };

    // Resolve the franchise referral code to a partner. An unknown or inactive
    // code resolves to null and is simply not recorded — never an error, so a
    // stale invite link can't block a merchant from signing up.
    const referral = await this.resolveFranchiseReferral(dto.ref);

    // First-touch: never overwrite an attribution that is already recorded.
    const firstTouch = <T>(existing: T | null, incoming: T | undefined) =>
      existing ?? incoming ?? null;
    const data = {
      utmSource: firstTouch(app.utmSource, dto.utmSource),
      utmMedium: firstTouch(app.utmMedium, dto.utmMedium),
      utmCampaign: firstTouch(app.utmCampaign, dto.utmCampaign),
      utmContent: firstTouch(app.utmContent, dto.utmContent),
      fbclid: firstTouch(app.fbclid, dto.fbclid),
      // Attribution is owned by the partner, so franchiseId and referralCode are
      // held first-touch together — the code that won is always the code stored.
      franchiseId: firstTouch(app.franchiseId, referral?.id),
      referralCode: firstTouch(app.referralCode, referral?.referralCode ?? undefined),
    };
    await this.prisma.merchantApplication.update({ where: { id: app.id }, data });
    return { updated: true, franchiseId: data.franchiseId };
  }

  /**
   * Look up an active franchise partner by referral code. Returns null for a
   * missing, unknown, or non-ACTIVE code — the caller treats that as "no referral"
   * rather than as a failure.
   */
  private async resolveFranchiseReferral(ref?: string) {
    const code = ref?.trim().toUpperCase();
    if (!code) return null;
    return this.prisma.franchisePartner.findFirst({
      where: { referralCode: code, status: FranchisePartnerStatus.ACTIVE },
      select: { id: true, referralCode: true },
    });
  }

  /**
   * Merchant onboarding funnel for the admin: signup → submit → review → approve,
   * plus where half-onboarded (draft) applicants drop off, step by step.
   */
  async getOnboardingFunnel(rangeDays = 30) {
    const since = new Date();
    since.setDate(since.getDate() - Math.max(1, Math.min(365, rangeDays)));
    const where = { createdAt: { gte: since } };

    const [byStatus, stepCompletionRaw, draftApps, signupsBySource, approvedBySource] =
      await Promise.all([
      this.prisma.merchantApplication.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      // How many applications have each step marked complete (canonical-normalized below).
      this.prisma.merchantOnboardingStep.groupBy({
        by: ['stepKey'],
        where: { completed: true, application: where },
        _count: { _all: true },
      }),
      // Draft (never-submitted) applications and the steps they have finished —
      // used to bucket "stuck at step X".
      this.prisma.merchantApplication.findMany({
        where: { ...where, status: MerchantApplicationStatus.DRAFT },
        select: {
          id: true,
          steps: { where: { completed: true }, select: { stepKey: true } },
        },
      }),
      // Acquisition source split (Meta / Google / organic …).
      this.prisma.merchantApplication.groupBy({
        by: ['utmSource'],
        where,
        _count: { _all: true },
      }),
      this.prisma.merchantApplication.groupBy({
        by: ['utmSource'],
        where: { ...where, status: MerchantApplicationStatus.APPROVED },
        _count: { _all: true },
      }),
    ]);

    const statusCount = (s: MerchantApplicationStatus) =>
      byStatus.find((g) => g.status === s)?._count._all ?? 0;

    const drafts = statusCount(MerchantApplicationStatus.DRAFT);
    const submittedStatuses = [
      MerchantApplicationStatus.SUBMITTED,
      MerchantApplicationStatus.UNDER_REVIEW,
      MerchantApplicationStatus.KYC_PENDING,
      MerchantApplicationStatus.APPROVED,
      MerchantApplicationStatus.REJECTED,
    ];
    const submitted = submittedStatuses.reduce((sum, s) => sum + statusCount(s), 0);
    const underReview = statusCount(MerchantApplicationStatus.UNDER_REVIEW);
    const kycPending = statusCount(MerchantApplicationStatus.KYC_PENDING);
    const approved = statusCount(MerchantApplicationStatus.APPROVED);
    const rejected = statusCount(MerchantApplicationStatus.REJECTED);
    const signups = byStatus.reduce((sum, g) => sum + g._count._all, 0);

    // Canonical-normalized per-step completion counts.
    const stepCompletion = CANONICAL_STEPS.map((step) => {
      const completed = stepCompletionRaw
        .filter((g) => canonicalStep(g.stepKey) === step)
        .reduce((sum, g) => sum + g._count._all, 0);
      return { step, label: STEP_LABELS[step], completed };
    });

    // Bucket each draft app by the FIRST canonical step it has not completed —
    // that is where the applicant is stuck.
    const stuckCounts = new Map<MerchantOnboardingStepKey, number>();
    let draftsFullyFilled = 0; // completed all steps but never submitted
    for (const app of draftApps) {
      const done = new Set(app.steps.map((s) => canonicalStep(s.stepKey)));
      const stuckAt = CANONICAL_STEPS.find((step) => !done.has(step));
      if (!stuckAt) {
        draftsFullyFilled += 1;
        continue;
      }
      stuckCounts.set(stuckAt, (stuckCounts.get(stuckAt) ?? 0) + 1);
    }
    const stuckAtStep = CANONICAL_STEPS.map((step) => ({
      step,
      label: STEP_LABELS[step],
      count: stuckCounts.get(step) ?? 0,
    })).filter((s) => s.count > 0);

    const pct = (num: number, den: number) =>
      den > 0 ? Math.round((num / den) * 1000) / 10 : 0;

    // Merge signup + approved counts per source into one sorted table.
    const approvedMap = new Map<string, number>(
      approvedBySource.map((g) => [g.utmSource ?? '', g._count._all]),
    );
    const bySource = signupsBySource
      .map((g) => {
        const source = g.utmSource ?? '';
        const src = source || 'Direct / organic';
        const sourceSignups = g._count._all;
        const sourceApproved = approvedMap.get(source) ?? 0;
        return {
          source: src,
          signups: sourceSignups,
          approved: sourceApproved,
          conversion: pct(sourceApproved, sourceSignups),
        };
      })
      .sort((a, b) => b.signups - a.signups);

    return {
      rangeDays,
      totals: { signups, drafts, submitted, underReview, kycPending, approved, rejected },
      bySource,
      conversion: {
        signupToSubmit: pct(submitted, signups),
        submitToApprove: pct(approved, submitted),
        overall: pct(approved, signups),
        dropOffAtDraft: pct(drafts, signups),
      },
      stepCompletion,
      stuckAtStep,
      draftsFullyFilled,
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

  async resolveStoreLocation(userId: string, dto: ResolveStoreLocationDto) {
    const app = await this.getOrCreateApplication(userId);

    let pincode = dto.pincode?.trim() ?? '';
    let city = dto.city?.trim() ?? '';
    let state = dto.state?.trim() ?? '';
    let locality = dto.locality?.trim() ?? '';
    const latitude = dto.latitude;
    const longitude = dto.longitude;

    if ((!pincode || !city || !state) && this.geocoding.isConfigured()) {
      const geocoded = await this.geocoding.reverseGeocode(latitude, longitude);
      if (geocoded) {
        pincode = pincode || geocoded.pincode;
        city = city || geocoded.city;
        state = state || geocoded.state;
        locality = locality || geocoded.locality || geocoded.line1;
      }
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      const geocodeHint = this.geocoding.isConfigured()
        ? ''
        : ' Server geocoding is not configured (set GOOGLE_MAPS_API_KEY on API).';
      throw new BadRequestException(
        `A valid 6-digit pincode is required. Pin your store on the map or use GPS.${geocodeHint}`,
      );
    }

    const mld = await this.locations.tryResolvePincode({
      pincode,
      locationCityId: dto.locationCityId,
      locationAreaId: dto.locationAreaId,
      latitude,
      longitude,
    });

    if (mld.inMasterDirectory) {
      city = city || mld.city;
      state = state || mld.state;
      locality = locality || mld.locality || mld.city;
    }

    if (!city || !state) {
      throw new BadRequestException(
        'City and state are required. Try search, GPS, or drag the map pin.',
      );
    }

    let cityId: string;
    let locationPincodeId: string | undefined;
    let locationAreaId: string | undefined;
    let locationCityId: string | undefined;
    const expansionArea = !mld.inMasterDirectory;

    if (mld.inMasterDirectory) {
      locationPincodeId = mld.locationPincodeId;
      locationAreaId = mld.locationAreaId;
      locationCityId = mld.locationCityId;
      if (mld.operationalCityId) {
        cityId = mld.operationalCityId;
      } else {
        const opCity = await this.geo.findOrCreateOperationalCity({
          name: mld.city,
          state: mld.state,
          latitude: latitude ?? mld.latitude,
          longitude: longitude ?? mld.longitude,
        });
        cityId = opCity.id;
      }
      if (!locality) locality = mld.locality ?? city;
    } else {
      const opCity = await this.geo.findOrCreateOperationalCity({
        name: city,
        state,
        latitude,
        longitude,
      });
      cityId = opCity.id;
    }

    const operationalCity = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: { id: true, name: true, slug: true },
    });

    const existingFlags =
      app.riskFlags && typeof app.riskFlags === 'object' && !Array.isArray(app.riskFlags)
        ? (app.riskFlags as Record<string, unknown>)
        : {};

    await this.prisma.merchantApplication.update({
      where: { id: app.id },
      data: {
        pincode,
        city,
        state,
        locality: locality || undefined,
        latitude,
        longitude,
        cityId,
        locationPincodeId: locationPincodeId ?? null,
        locationAreaId: locationAreaId ?? null,
        locationCityId: locationCityId ?? null,
        riskFlags: {
          ...existingFlags,
          expansionArea,
          inMasterDirectory: mld.inMasterDirectory,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      pincode,
      city,
      state,
      locality,
      latitude,
      longitude,
      cityId,
      operationalCityName: operationalCity?.name ?? city,
      locationPincodeId,
      locationAreaId,
      locationCityId,
      inMasterDirectory: mld.inMasterDirectory,
      expansionArea,
    };
  }

  async updateStep(userId: string, dto: UpdateOnboardingStepDto, ipAddress?: string) {
    await this.getOrCreateApplication(userId);
    const app = await this.requireDraftApplication(userId);
    // stepKey is optional: when omitted, this is a draft save that persists the
    // merchant's in-progress fields WITHOUT marking the step complete (used for
    // autosave so progress survives an account switch mid-onboarding).
    const stepKey = dto.stepKey ? this.normalizeStepKey(dto.stepKey) : undefined;
    const ownerName = dto.ownerName ?? dto.ownerFullName;
    const ownerPhone = dto.ownerPhone ?? dto.contactMobile ?? dto.storePhone;
    const ownerEmail = dto.ownerEmail ?? dto.storeEmail;
    const businessName = dto.businessName ?? dto.legalName;
    const gstNumber = dto.gstNumber ?? dto.gstin;
    const panNumber = dto.panNumber ?? dto.pan;
    const storeAddress = dto.storeAddress ?? dto.addressLine;
    const locality = dto.locality ?? dto.area;
    const deliveryRadiusKm = dto.deliveryRadiusKm ?? dto.deliveryRadius;
    const deliveryCoveragePincodes = dto.deliveryCoveragePincodes ?? dto.deliveryPincodes;
    const data: Prisma.MerchantApplicationUpdateInput = {};

    if (ownerName) data.ownerName = ownerName;
    if (ownerEmail) data.ownerEmail = ownerEmail.trim().toLowerCase();
    if (ownerPhone) {
      data.ownerPhone = this.normalizeIndianPhone(ownerPhone);
      await this.syncUserPhoneIfNeeded(userId, ownerPhone);
    }
    if (businessName) data.businessName = businessName;
    if (dto.businessType) data.businessType = dto.businessType;
    if (dto.businessTypes?.length) {
      await this.syncApplicationBusinessTypes(app.id, dto.businessTypes);
      if (!dto.businessType) data.businessType = dto.businessTypes[0];
    }
    if (gstNumber) {
      const gst = normalizeGstin(gstNumber);
      data.gstNumber = gst;
      data.gstVerified = isValidGstin(gst);
    }
    if (panNumber) data.panNumber = panNumber.toUpperCase();
    if (dto.storeName) data.storeName = dto.storeName;
    if (storeAddress) data.storeAddress = storeAddress;
    if (dto.pickupAddress) {
      data.pickupAddress = dto.pickupAddress as unknown as Prisma.InputJsonValue;
    }
    if (dto.state) data.state = dto.state;
    if (dto.city) data.city = dto.city;
    if (dto.cityId) data.cityId = dto.cityId;
    if (dto.pincode) data.pincode = dto.pincode;
    if (locality) data.locality = locality;
    if (dto.locationPincodeId) data.locationPincodeId = dto.locationPincodeId;
    if (dto.locationAreaId) data.locationAreaId = dto.locationAreaId;
    if (dto.locationCityId) data.locationCityId = dto.locationCityId;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (deliveryRadiusKm !== undefined) data.deliveryRadiusKm = deliveryRadiusKm;
    if (dto.storeLogoUrl) data.storeLogoUrl = dto.storeLogoUrl;
    if (dto.storeBannerUrl) data.storeBannerUrl = dto.storeBannerUrl;
    if (deliveryCoveragePincodes) {
      data.deliveryCoveragePincodes = deliveryCoveragePincodes;
    }

    if (dto.password && ownerEmail) {
      const passwordHash = await this.passwordService.hash(dto.password);
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, email: ownerEmail.trim().toLowerCase(), emailVerified: true },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.merchantApplication.update({
        where: { id: app.id },
        data,
        include: this.applicationInclude(),
      });

      await this.saveBankPayloadIfComplete(tx, app, dto);
      if (stepKey) {
        await this.markStepCompleted(tx, app.id, stepKey, dto);
      }

      return result;
    });

    if (stepKey === MerchantOnboardingStepKey.BUSINESS && businessName && panNumber) {
      try {
        await this.merchantService.getProfile(userId);
      } catch {
        await this.merchantService.createProfile(
          userId,
          {
            businessName,
            gstNumber,
            panNumber,
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

    if (stepKey === MerchantOnboardingStepKey.REVIEW) {
      this.assertSubmissionReady(withRisk);
      if (dto.submittedForApproval) {
        return this.submitApplication(userId, ipAddress);
      }
    }

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

    await this.markStepKeysCompleted(app.id, [
      MerchantOnboardingStepKey.GST_PAN,
      MerchantOnboardingStepKey.DOCUMENTS,
    ]);

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

    await this.markStepKeysCompleted(app.id, [
      MerchantOnboardingStepKey.BANK,
      MerchantOnboardingStepKey.BANK_DETAILS,
    ]);

    return this.getOrCreateApplication(userId);
  }

  async submitApplication(userId: string, ipAddress?: string) {
    let app = await this.requireDraftApplication(userId);
    if (!app.cityId && app.city && app.state && app.latitude != null && app.longitude != null) {
      const city = await this.geo.findOrCreateOperationalCity({
        name: app.city,
        state: app.state,
        latitude: app.latitude,
        longitude: app.longitude,
      });
      app = await this.prisma.merchantApplication.update({
        where: { id: app.id },
        data: { cityId: city.id },
        include: this.applicationInclude(),
      });
    }
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
    } else {
      // Profile exists — role granted only on admin approval.
    }

    let storeId = app.storeId;
    if (!storeId) {
      const pickupAddress = this.getPickupAddress(app.pickupAddress);
      const line2 = [
        pickupAddress?.addressLine2,
        pickupAddress?.landmark ? `Landmark: ${pickupAddress.landmark}` : undefined,
        pickupAddress?.pickupInstructions ? `Pickup: ${pickupAddress.pickupInstructions}` : undefined,
      ].filter(Boolean).join(' · ') || undefined;
      const storeDto: CreateStoreDto = {
        name: app.storeName!,
        phone: app.ownerPhone!,
        email: app.ownerEmail!,
        line1: pickupAddress?.addressLine1 ?? app.storeAddress!,
        line2,
        pincode: pickupAddress?.pincode ?? app.pincode!,
        latitude: pickupAddress?.latitude ?? app.latitude!,
        longitude: pickupAddress?.longitude ?? app.longitude!,
        cityId: app.cityId!,
        locationPincodeId: app.locationPincodeId ?? undefined,
        locationAreaId: app.locationAreaId ?? undefined,
        locationCityId: app.locationCityId ?? undefined,
        logoUrl: app.storeLogoUrl!,
        bannerUrl: app.storeBannerUrl!,
        deliveryCoveragePincodes: Array.isArray(app.deliveryCoveragePincodes)
          ? (app.deliveryCoveragePincodes as string[])
          : app.pincode
            ? [app.pincode]
            : undefined,
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

      await this.verticalService.ensureStoreBusinessTypesFromApplication(storeId);
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

  /**
   * @deprecated Not the franchise funnel. This only files a support ticket and it
   * requires an authenticated MERCHANT, which is backwards — a prospective
   * franchisee is not a merchant. It creates no ExpansionLead and cannot lead to a
   * FranchisePartner.
   *
   * The real funnel is the public, unauthenticated `POST /franchise/apply`
   * (FranchiseApplicationService.submitApplication), which creates an ExpansionLead
   * that an admin can approve into a partner. Build nothing new on this method.
   */
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

    await this.merchantService.ensureMerchantRole(app.userId);

    // Franchise attribution becomes permanent here: approval is the single choke
    // point where a recruited merchant turns into a real store. Copy the referral
    // onto the store, then create the FranchiseStore link that settlement reads.
    // Never let an attribution failure block an otherwise valid approval.
    if (app.franchiseId) {
      try {
        await this.prisma.store.update({
          where: { id: app.storeId },
          data: { franchiseId: app.franchiseId, referralCode: app.referralCode },
        });
        await this.franchiseService.linkStore(app.franchiseId, app.storeId, adminId);
      } catch (err) {
        this.logger.error(
          `Franchise attribution failed for application ${id} (franchise ${app.franchiseId}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
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
      businessTypes: true,
      store: { select: { id: true, name: true, status: true } },
      merchantProfile: {
        select: { id: true, businessName: true, kycStatus: true, isBlacklisted: true },
      },
    } satisfies Prisma.MerchantApplicationInclude;
  }

  private normalizeStepKey(stepKey: MerchantOnboardingStepKey): MerchantOnboardingStepKey {
    return LEGACY_STEP_ALIASES[stepKey] ?? stepKey;
  }

  private normalizeIndianPhone(phone: string) {
    return phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
  }

  private async markStepCompleted(
    tx: Prisma.TransactionClient,
    applicationId: string,
    stepKey: MerchantOnboardingStepKey,
    dto: UpdateOnboardingStepDto,
  ) {
    const payload = JSON.parse(JSON.stringify(dto)) as Prisma.InputJsonValue;
    const keys = new Set(
      [stepKey, dto.stepKey].filter(
        (k): k is MerchantOnboardingStepKey => Boolean(k),
      ),
    );

    for (const key of keys) {
      await tx.merchantOnboardingStep.upsert({
        where: { applicationId_stepKey: { applicationId, stepKey: key } },
        create: {
          applicationId,
          stepKey: key,
          completed: true,
          completedAt: new Date(),
          data: payload,
        },
        update: {
          completed: true,
          completedAt: new Date(),
          data: payload,
        },
      });
    }
  }

  private async markStepKeysCompleted(applicationId: string, stepKeys: MerchantOnboardingStepKey[]) {
    await this.prisma.$transaction(async (tx) => {
      for (const stepKey of stepKeys) {
        await tx.merchantOnboardingStep.upsert({
          where: { applicationId_stepKey: { applicationId, stepKey } },
          create: { applicationId, stepKey, completed: true, completedAt: new Date() },
          update: { completed: true, completedAt: new Date() },
        });
      }
    });
  }

  private async saveBankPayloadIfComplete(
    tx: Prisma.TransactionClient,
    app: Prisma.MerchantApplicationGetPayload<{ include: ReturnType<MerchantOnboardingService['applicationInclude']> }>,
    dto: UpdateOnboardingStepDto,
  ) {
    const hasBankPayload = Boolean(
      dto.accountHolderName || dto.accountNumber || dto.ifsc || dto.bankName,
    );
    if (!hasBankPayload) return;

    const accountHolderName = dto.accountHolderName ?? app.bankAccount?.accountHolderName;
    const accountNumber = dto.accountNumber ?? app.bankAccount?.accountNumber;
    const ifsc = dto.ifsc ?? app.bankAccount?.ifsc;
    if (!accountHolderName || !accountNumber || !ifsc) return;

    await tx.merchantBankAccount.upsert({
      where: { applicationId: app.id },
      create: {
        applicationId: app.id,
        accountHolderName,
        accountNumber,
        ifsc: ifsc.toUpperCase(),
        bankName: dto.bankName ?? app.bankAccount?.bankName,
      },
      update: {
        accountHolderName,
        accountNumber,
        ifsc: ifsc.toUpperCase(),
        bankName: dto.bankName ?? app.bankAccount?.bankName,
      },
    });
  }

  private async syncUserPhoneIfNeeded(userId: string, ownerPhone: string) {
    const normalized = this.normalizeIndianPhone(ownerPhone);
    if (!/^\+91[6-9]\d{9}$/.test(normalized)) {
      throw new BadRequestException('Enter a valid 10-digit Indian mobile number');
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const isPlaceholder = /^\+910000\d{7}$/.test(user.phone);

    if (!isPlaceholder && user.phone === normalized) return;

    if (!isPlaceholder && user.phoneVerified) return;

    const taken = await this.prisma.user.findFirst({
      where: { phone: normalized, NOT: { id: userId } },
    });
    if (taken) {
      throw new ConflictException('This mobile number is already registered to another account');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { phone: normalized, phoneVerified: true },
    });
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
    const pickupAddress = this.getPickupAddress(app.pickupAddress);
    if (!pickupAddress?.addressLine1 && !app.storeAddress) missing.push('storeAddress');
    if (!pickupAddress?.landmark) missing.push('landmark');
    if (!app.cityId) missing.push('cityId');
    if (!app.pincode) missing.push('pincode');
    if (app.latitude == null) missing.push('latitude');
    if (app.longitude == null) missing.push('longitude');
    if (!app.storeLogoUrl) missing.push('storeLogoUrl');
    if (!app.storeBannerUrl) missing.push('storeBannerUrl');
    if (!app.bankAccount) missing.push('bankAccount');
    if (app.documents.length < 2) missing.push('documents');

    if (missing.length) {
      throw new BadRequestException(`Application incomplete: ${missing.join(', ')}`);
    }
  }

  private async syncApplicationBusinessTypes(
    applicationId: string,
    types: MerchantBusinessType[],
  ) {
    const verticals = types
      .map((t) => this.toVerticalBusinessType(t))
      .filter((v): v is VerticalBusinessType => v != null);

    if (verticals.length === 0) return;

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.merchantApplicationBusinessType.findMany({
        where: { applicationId },
      });
      const existingSet = new Set(existing.map((e) => e.businessType));
      for (const type of verticals) {
        if (!existingSet.has(type)) {
          await tx.merchantApplicationBusinessType.create({
            data: { applicationId, businessType: type },
          });
        }
      }
    });
  }

  private toVerticalBusinessType(type: MerchantBusinessType): VerticalBusinessType | null {
    const map: Partial<Record<MerchantBusinessType, VerticalBusinessType>> = {
      GROCERY: VerticalBusinessType.GROCERY,
      RESTAURANT: VerticalBusinessType.RESTAURANT,
      CLOUD_KITCHEN: VerticalBusinessType.CLOUD_KITCHEN,
      CAFE: VerticalBusinessType.CAFE,
      BAKERY: VerticalBusinessType.BAKERY,
      SWEETS: VerticalBusinessType.SWEETS,
      FRUITS_VEGETABLES: VerticalBusinessType.FRUITS_VEGETABLES,
      MEAT_FISH: VerticalBusinessType.MEAT_FISH,
      BEAUTY: VerticalBusinessType.BEAUTY,
      PET_STORE: VerticalBusinessType.PET_STORE,
      HOME_KITCHEN: VerticalBusinessType.HOME_KITCHEN,
      ELECTRONICS: VerticalBusinessType.ELECTRONICS,
      BABY_STORE: VerticalBusinessType.BABY_STORE,
      SUPPLEMENTS: VerticalBusinessType.SUPPLEMENTS,
      HEALTH_NUTRITION: VerticalBusinessType.SUPPLEMENTS,
      FLOWERS: VerticalBusinessType.FLOWERS,
      LOCAL_STORE: VerticalBusinessType.LOCAL_STORE,
      OTHER: VerticalBusinessType.LOCAL_STORE,
    };
    return map[type] ?? null;
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
      businessTypes: app.businessTypes?.map((b) => b.businessType) ?? (app.businessType ? [app.businessType] : []),
      gstNumber: app.gstNumber,
      gstVerified: app.gstVerified,
      panNumber: app.panNumber,
      storeName: app.storeName,
      storeAddress: app.storeAddress,
      pickupAddress: app.pickupAddress,
      state: app.state,
      city: app.city,
      cityId: app.cityId,
      pincode: app.pincode,
      locality: app.locality,
      locationPincodeId: app.locationPincodeId,
      locationAreaId: app.locationAreaId,
      locationCityId: app.locationCityId,
      latitude: app.latitude,
      longitude: app.longitude,
      deliveryRadiusKm: app.deliveryRadiusKm,
      storeLogoUrl: app.storeLogoUrl,
      storeBannerUrl: app.storeBannerUrl,
      deliveryCoveragePincodes: app.deliveryCoveragePincodes,
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

  private getPickupAddress(value: Prisma.JsonValue | null): PickupAddressPayload | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const candidate = value as Partial<PickupAddressPayload>;
    if (
      typeof candidate.addressLine1 !== 'string' ||
      typeof candidate.locality !== 'string' ||
      typeof candidate.landmark !== 'string' ||
      typeof candidate.city !== 'string' ||
      typeof candidate.state !== 'string' ||
      typeof candidate.pincode !== 'string' ||
      typeof candidate.latitude !== 'number' ||
      typeof candidate.longitude !== 'number'
    ) {
      return null;
    }
    return candidate as PickupAddressPayload;
  }

  private async sendSubmissionNotifications(
    userId: string,
    email: string | null,
    _phone: string | null,
    businessName: string,
  ) {
    if (email) {
      void this.emailNotifications.sendMerchantApplicationReceived(email, businessName);
    }
    void this.emailNotifications.sendAdminNewMerchantApplication(businessName, email ?? undefined);
    this.logger.log({ userId, businessName }, 'Merchant application submitted — SMS/WhatsApp via CRM orchestrator');
  }
}
