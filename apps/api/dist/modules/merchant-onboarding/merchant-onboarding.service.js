"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MerchantOnboardingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantOnboardingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const merchant_service_1 = require("../merchant/merchant.service");
const store_service_1 = require("../store/store.service");
const admin_store_service_1 = require("../admin/admin-store.service");
const gst_validation_util_1 = require("../compliance/gst-validation.util");
const marketing_event_service_1 = require("../crm/marketing-event.service");
const risk_engine_service_1 = require("../trust-safety/risk-engine.service");
const support_ticket_service_1 = require("../support/support-ticket.service");
const email_notification_service_1 = require("../email/email-notification.service");
const password_service_1 = require("../auth/password.service");
const merchant_application_risk_service_1 = require("./merchant-application-risk.service");
const location_directory_service_1 = require("../location-directory/location-directory.service");
const geo_service_1 = require("../geo/geo.service");
const geocoding_cache_service_1 = require("../geocoding/geocoding-cache.service");
const vertical_service_1 = require("../store-vertical/vertical.service");
const DOC_TO_STORE = {
    GST_CERTIFICATE: client_1.StoreDocumentType.GST_CERTIFICATE,
    PAN_CARD: client_1.StoreDocumentType.PAN_CARD,
    SHOP_LICENSE: client_1.StoreDocumentType.TRADE_LICENSE,
    FSSAI_LICENSE: client_1.StoreDocumentType.FSSAI_LICENSE,
    CANCELLED_CHEQUE: client_1.StoreDocumentType.BANK_PROOF,
    TRADE_LICENSE: client_1.StoreDocumentType.TRADE_LICENSE,
    BANK_PROOF: client_1.StoreDocumentType.BANK_PROOF,
    OWNER_PHOTO: client_1.StoreDocumentType.OTHER,
    STORE_PHOTO: client_1.StoreDocumentType.OTHER,
    OTHER: client_1.StoreDocumentType.OTHER,
};
const CANONICAL_STEPS = [
    client_1.MerchantOnboardingStepKey.VERIFY,
    client_1.MerchantOnboardingStepKey.BUSINESS,
    client_1.MerchantOnboardingStepKey.STORE,
    client_1.MerchantOnboardingStepKey.LOCATION,
    client_1.MerchantOnboardingStepKey.DELIVERY,
    client_1.MerchantOnboardingStepKey.CATEGORIES,
    client_1.MerchantOnboardingStepKey.GST_PAN,
    client_1.MerchantOnboardingStepKey.BANK,
    client_1.MerchantOnboardingStepKey.REVIEW,
];
const LEGACY_STEP_ALIASES = {
    [client_1.MerchantOnboardingStepKey.PERSONAL_DETAILS]: client_1.MerchantOnboardingStepKey.VERIFY,
    [client_1.MerchantOnboardingStepKey.BUSINESS_DETAILS]: client_1.MerchantOnboardingStepKey.BUSINESS,
    [client_1.MerchantOnboardingStepKey.STORE_DETAILS]: client_1.MerchantOnboardingStepKey.STORE,
    [client_1.MerchantOnboardingStepKey.DOCUMENTS]: client_1.MerchantOnboardingStepKey.GST_PAN,
    [client_1.MerchantOnboardingStepKey.BANK_DETAILS]: client_1.MerchantOnboardingStepKey.BANK,
};
const ALL_STEPS = CANONICAL_STEPS;
let MerchantOnboardingService = MerchantOnboardingService_1 = class MerchantOnboardingService {
    constructor(prisma, merchantService, storeService, adminStoreService, audit, riskService, riskEngine, marketingEvents, supportTickets, emailNotifications, passwordService, locations, geo, geocoding, verticalService) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.storeService = storeService;
        this.adminStoreService = adminStoreService;
        this.audit = audit;
        this.riskService = riskService;
        this.riskEngine = riskEngine;
        this.marketingEvents = marketingEvents;
        this.supportTickets = supportTickets;
        this.emailNotifications = emailNotifications;
        this.passwordService = passwordService;
        this.locations = locations;
        this.geo = geo;
        this.geocoding = geocoding;
        this.verticalService = verticalService;
        this.logger = new common_1.Logger(MerchantOnboardingService_1.name);
    }
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
    async getOrCreateApplication(userId) {
        const existing = await this.prisma.merchantApplication.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: this.applicationInclude(),
        });
        if (existing)
            return this.formatApplication(existing);
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
            eventType: client_1.MarketingEventType.MERCHANT_SIGNUP,
            metadata: { source: 'merchant_onboarding' },
        });
        await this.riskEngine.getOrCreateProfile(userId);
        return this.formatApplication(app);
    }
    async resolveStoreLocation(userId, dto) {
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
            throw new common_1.BadRequestException(`A valid 6-digit pincode is required. Pin your store on the map or use GPS.${geocodeHint}`);
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
            throw new common_1.BadRequestException('City and state are required. Try search, GPS, or drag the map pin.');
        }
        let cityId;
        let locationPincodeId;
        let locationAreaId;
        let locationCityId;
        const expansionArea = !mld.inMasterDirectory;
        if (mld.inMasterDirectory) {
            locationPincodeId = mld.locationPincodeId;
            locationAreaId = mld.locationAreaId;
            locationCityId = mld.locationCityId;
            if (mld.operationalCityId) {
                cityId = mld.operationalCityId;
            }
            else {
                const opCity = await this.geo.findOrCreateOperationalCity({
                    name: mld.city,
                    state: mld.state,
                    latitude: latitude ?? mld.latitude,
                    longitude: longitude ?? mld.longitude,
                });
                cityId = opCity.id;
            }
            if (!locality)
                locality = mld.locality ?? city;
        }
        else {
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
        const existingFlags = app.riskFlags && typeof app.riskFlags === 'object' && !Array.isArray(app.riskFlags)
            ? app.riskFlags
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
                },
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
    async updateStep(userId, dto, ipAddress) {
        await this.getOrCreateApplication(userId);
        const app = await this.requireDraftApplication(userId);
        const stepKey = this.normalizeStepKey(dto.stepKey);
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
        const data = {};
        if (ownerName)
            data.ownerName = ownerName;
        if (ownerEmail)
            data.ownerEmail = ownerEmail.trim().toLowerCase();
        if (ownerPhone) {
            data.ownerPhone = this.normalizeIndianPhone(ownerPhone);
            await this.syncUserPhoneIfNeeded(userId, ownerPhone);
        }
        if (businessName)
            data.businessName = businessName;
        if (dto.businessType)
            data.businessType = dto.businessType;
        if (dto.businessTypes?.length) {
            await this.syncApplicationBusinessTypes(app.id, dto.businessTypes);
            if (!dto.businessType)
                data.businessType = dto.businessTypes[0];
        }
        if (gstNumber) {
            const gst = (0, gst_validation_util_1.normalizeGstin)(gstNumber);
            data.gstNumber = gst;
            data.gstVerified = (0, gst_validation_util_1.isValidGstin)(gst);
        }
        if (panNumber)
            data.panNumber = panNumber.toUpperCase();
        if (dto.storeName)
            data.storeName = dto.storeName;
        if (storeAddress)
            data.storeAddress = storeAddress;
        if (dto.pickupAddress) {
            data.pickupAddress = dto.pickupAddress;
        }
        if (dto.state)
            data.state = dto.state;
        if (dto.city)
            data.city = dto.city;
        if (dto.cityId)
            data.cityId = dto.cityId;
        if (dto.pincode)
            data.pincode = dto.pincode;
        if (locality)
            data.locality = locality;
        if (dto.locationPincodeId)
            data.locationPincodeId = dto.locationPincodeId;
        if (dto.locationAreaId)
            data.locationAreaId = dto.locationAreaId;
        if (dto.locationCityId)
            data.locationCityId = dto.locationCityId;
        if (dto.latitude !== undefined)
            data.latitude = dto.latitude;
        if (dto.longitude !== undefined)
            data.longitude = dto.longitude;
        if (deliveryRadiusKm !== undefined)
            data.deliveryRadiusKm = deliveryRadiusKm;
        if (dto.storeLogoUrl)
            data.storeLogoUrl = dto.storeLogoUrl;
        if (dto.storeBannerUrl)
            data.storeBannerUrl = dto.storeBannerUrl;
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
            await this.markStepCompleted(tx, app.id, stepKey, dto);
            return result;
        });
        if (stepKey === client_1.MerchantOnboardingStepKey.BUSINESS && businessName && panNumber) {
            try {
                await this.merchantService.getProfile(userId);
            }
            catch {
                await this.merchantService.createProfile(userId, {
                    businessName,
                    gstNumber,
                    panNumber,
                }, ipAddress);
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
        if (stepKey === client_1.MerchantOnboardingStepKey.REVIEW) {
            this.assertSubmissionReady(withRisk);
            if (dto.submittedForApproval) {
                return this.submitApplication(userId, ipAddress);
            }
        }
        return this.formatApplication(withRisk);
    }
    validateGst(gstNumber) {
        const normalized = (0, gst_validation_util_1.normalizeGstin)(gstNumber);
        const valid = (0, gst_validation_util_1.isValidGstin)(normalized);
        return { gstNumber: normalized, valid, message: valid ? 'GST verified' : 'GST invalid' };
    }
    async uploadDocument(userId, dto) {
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
        }
        else {
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
            client_1.MerchantOnboardingStepKey.GST_PAN,
            client_1.MerchantOnboardingStepKey.DOCUMENTS,
        ]);
        return this.getOrCreateApplication(userId);
    }
    async saveBankAccount(userId, dto) {
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
            client_1.MerchantOnboardingStepKey.BANK,
            client_1.MerchantOnboardingStepKey.BANK_DETAILS,
        ]);
        return this.getOrCreateApplication(userId);
    }
    async submitApplication(userId, ipAddress) {
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
            profile = await this.merchantService.createProfile(userId, {
                businessName: app.businessName,
                gstNumber: app.gstNumber ?? undefined,
                panNumber: app.panNumber,
            }, ipAddress);
        }
        else {
        }
        let storeId = app.storeId;
        if (!storeId) {
            const pickupAddress = this.getPickupAddress(app.pickupAddress);
            const line2 = [
                pickupAddress?.addressLine2,
                pickupAddress?.landmark ? `Landmark: ${pickupAddress.landmark}` : undefined,
                pickupAddress?.pickupInstructions ? `Pickup: ${pickupAddress.pickupInstructions}` : undefined,
            ].filter(Boolean).join(' · ') || undefined;
            const storeDto = {
                name: app.storeName,
                phone: app.ownerPhone,
                email: app.ownerEmail,
                line1: pickupAddress?.addressLine1 ?? app.storeAddress,
                line2,
                pincode: pickupAddress?.pincode ?? app.pincode,
                latitude: pickupAddress?.latitude ?? app.latitude,
                longitude: pickupAddress?.longitude ?? app.longitude,
                cityId: app.cityId,
                locationPincodeId: app.locationPincodeId ?? undefined,
                locationAreaId: app.locationAreaId ?? undefined,
                locationCityId: app.locationCityId ?? undefined,
                logoUrl: app.storeLogoUrl,
                bannerUrl: app.storeBannerUrl,
                deliveryCoveragePincodes: Array.isArray(app.deliveryCoveragePincodes)
                    ? app.deliveryCoveragePincodes
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
                const storeDocType = DOC_TO_STORE[doc.documentType] ?? client_1.StoreDocumentType.OTHER;
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
        const status = risk.riskScore >= 50
            ? client_1.MerchantApplicationStatus.KYC_PENDING
            : client_1.MerchantApplicationStatus.SUBMITTED;
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
            data: { status: client_1.MerchantKycStatus.SUBMITTED },
        });
        await this.prisma.merchantProfile.update({
            where: { id: profile.id },
            data: { kycStatus: client_1.KycStatus.SUBMITTED },
        });
        await this.prisma.merchantOnboardingStep.update({
            where: {
                applicationId_stepKey: {
                    applicationId: app.id,
                    stepKey: client_1.MerchantOnboardingStepKey.REVIEW,
                },
            },
            data: { completed: true, completedAt: new Date() },
        });
        await Promise.all([
            this.marketingEvents.track({
                userId,
                eventType: client_1.MarketingEventType.MERCHANT_APPLICATION_SUBMITTED,
                storeId,
                metadata: { applicationId: app.id, riskScore: risk.riskScore },
            }),
            this.supportTickets.createTicket({
                requesterUserId: userId,
                actorType: client_1.SupportActorType.MERCHANT,
                categoryCode: 'MERCHANT_ONBOARDING',
                subject: `New merchant application: ${app.businessName}`,
                description: `Store application submitted for ${app.storeName}. Risk score: ${risk.riskScore}.`,
                channel: 'IN_APP',
            }, ipAddress),
            this.sendSubmissionNotifications(userId, app.ownerEmail, app.ownerPhone, app.businessName),
            this.audit.log({
                actorId: userId,
                action: 'MERCHANT_APPLICATION_SUBMITTED',
                resourceType: 'merchant_application',
                resourceId: app.id,
                ipAddress,
                metadata: { storeId, riskScore: risk.riskScore },
            }),
        ]);
        return this.formatApplication(updated);
    }
    async getApplicationStatus(userId) {
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
                done: storeStatus === client_1.StoreStatus.UNDER_REVIEW || storeStatus === client_1.StoreStatus.APPROVED,
            },
            {
                key: 'kyc',
                label: 'KYC Review',
                done: app.status === client_1.MerchantApplicationStatus.APPROVED ||
                    storeStatus === client_1.StoreStatus.UNDER_REVIEW,
            },
            {
                key: 'store',
                label: 'Store Approval',
                done: storeStatus === client_1.StoreStatus.APPROVED,
            },
            { key: 'live', label: 'Live On Platform', done: storeStatus === client_1.StoreStatus.APPROVED },
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
    async getPostApprovalChecklist(userId) {
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
        if (!store || store.status !== client_1.StoreStatus.APPROVED) {
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
    async submitFranchiseLead(userId, dto) {
        await this.supportTickets.createTicket({
            requesterUserId: userId,
            actorType: client_1.SupportActorType.MERCHANT,
            categoryCode: 'MERCHANT_ONBOARDING',
            subject: `Franchise lead: ${dto.city}`,
            description: `Contact: ${dto.contactName}\nCity: ${dto.city}\n${dto.message ?? ''}`,
            channel: 'IN_APP',
        });
        return { success: true, message: 'Franchise interest recorded. Our team will contact you.' };
    }
    async listApplications(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (dto.status) {
            where.status = dto.status;
        }
        else {
            where.status = {
                in: [
                    client_1.MerchantApplicationStatus.SUBMITTED,
                    client_1.MerchantApplicationStatus.UNDER_REVIEW,
                    client_1.MerchantApplicationStatus.KYC_PENDING,
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
    async getApplication(id) {
        const app = await this.prisma.merchantApplication.findUnique({
            where: { id },
            include: this.applicationInclude(),
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        return this.formatApplication(app);
    }
    async approveApplication(adminId, id, ip) {
        const app = await this.prisma.merchantApplication.findUnique({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        if (!app.storeId)
            throw new common_1.BadRequestException('Application has no linked store');
        await this.adminStoreService.approveStore(adminId, app.storeId, ip);
        const updated = await this.prisma.merchantApplication.update({
            where: { id },
            data: {
                status: client_1.MerchantApplicationStatus.APPROVED,
                reviewedAt: new Date(),
                reviewedBy: adminId,
            },
            include: this.applicationInclude(),
        });
        await this.prisma.merchantKyc.update({
            where: { applicationId: id },
            data: { status: client_1.MerchantKycStatus.VERIFIED, verifiedAt: new Date(), verifiedBy: adminId },
        });
        if (app.merchantProfileId) {
            await this.prisma.merchantProfile.update({
                where: { id: app.merchantProfileId },
                data: { kycStatus: client_1.KycStatus.APPROVED },
            });
        }
        await this.merchantService.ensureMerchantRole(app.userId);
        await this.marketingEvents.track({
            userId: app.userId,
            eventType: client_1.MarketingEventType.MERCHANT_APPROVED,
            storeId: app.storeId,
            metadata: { applicationId: id },
        });
        if (app.ownerEmail) {
            void this.emailNotifications.sendWelcomeEmail(app.ownerEmail, app.ownerName ?? 'Partner');
        }
        return this.formatApplication(updated);
    }
    async rejectApplication(adminId, id, dto, ip) {
        const app = await this.prisma.merchantApplication.findUnique({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        if (app.storeId) {
            await this.adminStoreService.rejectStore(adminId, app.storeId, { reason: dto.reason, rejectionType: client_1.RejectionType.COMPLIANCE_ISSUE }, ip);
        }
        const updated = await this.prisma.merchantApplication.update({
            where: { id },
            data: {
                status: client_1.MerchantApplicationStatus.REJECTED,
                rejectionReason: dto.reason,
                reviewedAt: new Date(),
                reviewedBy: adminId,
            },
            include: this.applicationInclude(),
        });
        return this.formatApplication(updated);
    }
    async requestDocuments(adminId, id, dto, ip) {
        const app = await this.prisma.merchantApplication.findUnique({ where: { id } });
        if (!app?.storeId)
            throw new common_1.BadRequestException('Application has no linked store');
        const storeDocTypes = dto.documentTypes.map((t) => DOC_TO_STORE[t] ?? client_1.StoreDocumentType.OTHER);
        await this.adminStoreService.requestDocuments(adminId, app.storeId, { reason: dto.reason, documentTypes: storeDocTypes }, ip);
        const updated = await this.prisma.merchantApplication.update({
            where: { id },
            data: { status: client_1.MerchantApplicationStatus.KYC_PENDING, adminNotes: dto.reason },
            include: this.applicationInclude(),
        });
        return this.formatApplication(updated);
    }
    async requestChanges(adminId, id, dto) {
        const updated = await this.prisma.merchantApplication.update({
            where: { id },
            data: {
                status: client_1.MerchantApplicationStatus.UNDER_REVIEW,
                adminNotes: dto.message,
                reviewedBy: adminId,
            },
            include: this.applicationInclude(),
        });
        return this.formatApplication(updated);
    }
    async scheduleCall(adminId, id, dto) {
        const app = await this.prisma.merchantApplication.findUnique({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        await this.supportTickets.createTicket({
            requesterUserId: app.userId,
            actorType: client_1.SupportActorType.MERCHANT,
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
    applicationInclude() {
        return {
            documents: true,
            kyc: true,
            bankAccount: true,
            steps: { orderBy: { stepKey: 'asc' } },
            businessTypes: true,
            store: { select: { id: true, name: true, status: true } },
            merchantProfile: {
                select: { id: true, businessName: true, kycStatus: true, isBlacklisted: true },
            },
        };
    }
    normalizeStepKey(stepKey) {
        return LEGACY_STEP_ALIASES[stepKey] ?? stepKey;
    }
    normalizeIndianPhone(phone) {
        return phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    }
    async markStepCompleted(tx, applicationId, stepKey, dto) {
        const payload = JSON.parse(JSON.stringify(dto));
        const keys = new Set([stepKey, dto.stepKey]);
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
    async markStepKeysCompleted(applicationId, stepKeys) {
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
    async saveBankPayloadIfComplete(tx, app, dto) {
        const hasBankPayload = Boolean(dto.accountHolderName || dto.accountNumber || dto.ifsc || dto.bankName);
        if (!hasBankPayload)
            return;
        const accountHolderName = dto.accountHolderName ?? app.bankAccount?.accountHolderName;
        const accountNumber = dto.accountNumber ?? app.bankAccount?.accountNumber;
        const ifsc = dto.ifsc ?? app.bankAccount?.ifsc;
        if (!accountHolderName || !accountNumber || !ifsc)
            return;
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
    async syncUserPhoneIfNeeded(userId, ownerPhone) {
        const normalized = this.normalizeIndianPhone(ownerPhone);
        if (!/^\+91[6-9]\d{9}$/.test(normalized)) {
            throw new common_1.BadRequestException('Enter a valid 10-digit Indian mobile number');
        }
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const isPlaceholder = /^\+910000\d{7}$/.test(user.phone);
        if (!isPlaceholder && user.phone === normalized)
            return;
        if (!isPlaceholder && user.phoneVerified)
            return;
        const taken = await this.prisma.user.findFirst({
            where: { phone: normalized, NOT: { id: userId } },
        });
        if (taken) {
            throw new common_1.ConflictException('This mobile number is already registered to another account');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { phone: normalized, phoneVerified: true },
        });
    }
    async requireDraftApplication(userId) {
        const app = await this.prisma.merchantApplication.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: this.applicationInclude(),
        });
        if (!app)
            throw new common_1.NotFoundException('No application found. Start onboarding first.');
        if (app.status !== client_1.MerchantApplicationStatus.DRAFT &&
            app.status !== client_1.MerchantApplicationStatus.REJECTED) {
            throw new common_1.ConflictException(`Application cannot be edited in status: ${app.status}`);
        }
        return app;
    }
    assertSubmissionReady(app) {
        const missing = [];
        if (!app.ownerName)
            missing.push('ownerName');
        if (!app.ownerPhone)
            missing.push('ownerPhone');
        if (!app.ownerEmail)
            missing.push('ownerEmail');
        if (!app.businessName)
            missing.push('businessName');
        if (!app.businessType)
            missing.push('businessType');
        if (!app.panNumber)
            missing.push('panNumber');
        if (!app.storeName)
            missing.push('storeName');
        const pickupAddress = this.getPickupAddress(app.pickupAddress);
        if (!pickupAddress?.addressLine1 && !app.storeAddress)
            missing.push('storeAddress');
        if (!pickupAddress?.landmark)
            missing.push('landmark');
        if (!app.cityId)
            missing.push('cityId');
        if (!app.pincode)
            missing.push('pincode');
        if (app.latitude == null)
            missing.push('latitude');
        if (app.longitude == null)
            missing.push('longitude');
        if (!app.storeLogoUrl)
            missing.push('storeLogoUrl');
        if (!app.storeBannerUrl)
            missing.push('storeBannerUrl');
        if (!app.bankAccount)
            missing.push('bankAccount');
        if (app.documents.length < 2)
            missing.push('documents');
        if (missing.length) {
            throw new common_1.BadRequestException(`Application incomplete: ${missing.join(', ')}`);
        }
    }
    async syncApplicationBusinessTypes(applicationId, types) {
        const verticals = types
            .map((t) => this.toVerticalBusinessType(t))
            .filter((v) => v != null);
        if (verticals.length === 0)
            return;
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
    toVerticalBusinessType(type) {
        const map = {
            GROCERY: client_1.VerticalBusinessType.GROCERY,
            RESTAURANT: client_1.VerticalBusinessType.RESTAURANT,
            CLOUD_KITCHEN: client_1.VerticalBusinessType.CLOUD_KITCHEN,
            CAFE: client_1.VerticalBusinessType.CAFE,
            BAKERY: client_1.VerticalBusinessType.BAKERY,
            SWEETS: client_1.VerticalBusinessType.SWEETS,
            FRUITS_VEGETABLES: client_1.VerticalBusinessType.FRUITS_VEGETABLES,
            MEAT_FISH: client_1.VerticalBusinessType.MEAT_FISH,
            BEAUTY: client_1.VerticalBusinessType.BEAUTY,
            PET_STORE: client_1.VerticalBusinessType.PET_STORE,
            HOME_KITCHEN: client_1.VerticalBusinessType.HOME_KITCHEN,
            ELECTRONICS: client_1.VerticalBusinessType.ELECTRONICS,
            BABY_STORE: client_1.VerticalBusinessType.BABY_STORE,
            SUPPLEMENTS: client_1.VerticalBusinessType.SUPPLEMENTS,
            HEALTH_NUTRITION: client_1.VerticalBusinessType.SUPPLEMENTS,
            FLOWERS: client_1.VerticalBusinessType.FLOWERS,
            LOCAL_STORE: client_1.VerticalBusinessType.LOCAL_STORE,
            OTHER: client_1.VerticalBusinessType.LOCAL_STORE,
        };
        return map[type] ?? null;
    }
    formatApplication(app) {
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
    getPickupAddress(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value))
            return null;
        const candidate = value;
        if (typeof candidate.addressLine1 !== 'string' ||
            typeof candidate.locality !== 'string' ||
            typeof candidate.landmark !== 'string' ||
            typeof candidate.city !== 'string' ||
            typeof candidate.state !== 'string' ||
            typeof candidate.pincode !== 'string' ||
            typeof candidate.latitude !== 'number' ||
            typeof candidate.longitude !== 'number') {
            return null;
        }
        return candidate;
    }
    async sendSubmissionNotifications(userId, email, _phone, businessName) {
        if (email) {
            void this.emailNotifications.sendWelcomeEmail(email, businessName);
        }
        this.logger.log({ userId, businessName }, 'Merchant application submitted — SMS/WhatsApp via CRM orchestrator');
    }
};
exports.MerchantOnboardingService = MerchantOnboardingService;
exports.MerchantOnboardingService = MerchantOnboardingService = MerchantOnboardingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        store_service_1.StoreService,
        admin_store_service_1.AdminStoreService,
        audit_service_1.AuditService,
        merchant_application_risk_service_1.MerchantApplicationRiskService,
        risk_engine_service_1.RiskEngineService,
        marketing_event_service_1.MarketingEventService,
        support_ticket_service_1.SupportTicketService,
        email_notification_service_1.EmailNotificationService,
        password_service_1.PasswordService,
        location_directory_service_1.LocationDirectoryService,
        geo_service_1.GeoService,
        geocoding_cache_service_1.GeocodingCacheService,
        vertical_service_1.VerticalService])
], MerchantOnboardingService);
//# sourceMappingURL=merchant-onboarding.service.js.map