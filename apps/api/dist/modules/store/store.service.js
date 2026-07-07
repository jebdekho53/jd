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
var StoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const merchant_service_1 = require("../merchant/merchant.service");
const verification_blocklist_service_1 = require("../merchant/verification-blocklist.service");
const buyer_cache_service_1 = require("../buyer/buyer-cache.service");
const location_directory_service_1 = require("../location-directory/location-directory.service");
const config_1 = require("@nestjs/config");
const configuration_1 = require("../../config/configuration");
const trusted_upload_url_util_1 = require("../../common/utils/trusted-upload-url.util");
const APPROVED_STORE_EDITABLE_FIELDS = [
    'description', 'phone', 'email',
    'logoUrl', 'bannerUrl',
    'minOrderAmount', 'deliveryFee', 'avgPrepTimeMins',
    'hours', 'zoneIds', 'serviceAreaIds',
];
let StoreService = StoreService_1 = class StoreService {
    constructor(prisma, merchantService, audit, domainEvents, buyerCache, blocklist, locations, config) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.buyerCache = buyerCache;
        this.blocklist = blocklist;
        this.locations = locations;
        this.config = config;
        this.logger = new common_1.Logger(StoreService_1.name);
    }
    async createStore(userId, dto, ipAddress) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        await this.blocklist.assertUserNotBlacklisted(userId);
        await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);
        await this.assertMerchantNotBlocked(userId, {
            phone: dto.phone,
            email: dto.email,
            gstNumber: profile.gstNumber,
            panNumber: profile.panNumber,
        });
        const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
        if (!city) {
            throw new common_1.BadRequestException(`City not found: ${dto.cityId}`);
        }
        const mld = await this.locations.tryResolvePincode({
            pincode: dto.pincode,
            locationCityId: dto.locationCityId,
            locationAreaId: dto.locationAreaId,
            latitude: dto.latitude,
            longitude: dto.longitude,
        });
        const locationPincodeId = mld.inMasterDirectory
            ? dto.locationPincodeId ?? mld.locationPincodeId
            : dto.locationPincodeId;
        const locationAreaId = mld.inMasterDirectory
            ? dto.locationAreaId ?? mld.locationAreaId
            : dto.locationAreaId;
        const locationCityId = mld.inMasterDirectory
            ? dto.locationCityId ?? mld.locationCityId
            : dto.locationCityId;
        const latitude = dto.latitude ?? (mld.inMasterDirectory ? mld.latitude : undefined);
        const longitude = dto.longitude ?? (mld.inMasterDirectory ? mld.longitude : undefined);
        if (latitude == null || longitude == null) {
            throw new common_1.BadRequestException('Store latitude and longitude are required');
        }
        const slug = await this.generateUniqueSlug(profile.id, dto.name);
        const store = await this.prisma.$transaction(async (tx) => {
            const created = await tx.store.create({
                data: {
                    merchantProfileId: profile.id,
                    cityId: dto.cityId,
                    name: dto.name,
                    slug,
                    description: dto.description,
                    phone: dto.phone,
                    email: dto.email,
                    line1: dto.line1,
                    line2: dto.line2,
                    pincode: dto.pincode,
                    latitude,
                    longitude,
                    locationPincodeId: locationPincodeId ?? null,
                    locationAreaId: locationAreaId ?? null,
                    locationCityId: locationCityId ?? null,
                    logoUrl: dto.logoUrl,
                    bannerUrl: dto.bannerUrl,
                    minOrderAmount: dto.minOrderAmount ?? 0,
                    deliveryFee: dto.deliveryFee ?? 0,
                    avgPrepTimeMins: dto.avgPrepTimeMins ?? 15,
                    status: client_1.StoreStatus.DRAFT,
                    isActive: false,
                },
            });
            let zoneIds = dto.zoneIds;
            if (!zoneIds?.length) {
                const cityZones = await tx.zone.findMany({
                    where: { cityId: dto.cityId, isActive: true },
                    select: { id: true },
                });
                zoneIds = cityZones.map((z) => z.id);
            }
            if (zoneIds.length) {
                await tx.storeZone.createMany({
                    data: zoneIds.map((zoneId) => ({ storeId: created.id, zoneId })),
                    skipDuplicates: true,
                });
            }
            if (dto.serviceAreaIds?.length) {
                await tx.storeServiceArea.createMany({
                    data: dto.serviceAreaIds.map((serviceAreaId) => ({
                        storeId: created.id,
                        serviceAreaId,
                    })),
                    skipDuplicates: true,
                });
            }
            const hours = dto.hours?.length
                ? dto.hours
                : Object.values(client_1.DayOfWeek).map((dayOfWeek) => ({
                    dayOfWeek,
                    openTime: '09:00',
                    closeTime: '22:00',
                    isClosed: false,
                }));
            for (const h of hours) {
                await tx.storeHour.upsert({
                    where: { storeId_dayOfWeek: { storeId: created.id, dayOfWeek: h.dayOfWeek } },
                    update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
                    create: {
                        storeId: created.id,
                        dayOfWeek: h.dayOfWeek,
                        openTime: h.openTime,
                        closeTime: h.closeTime,
                        isClosed: h.isClosed,
                    },
                });
            }
            const coveragePincodes = [
                ...new Set([dto.pincode, ...(dto.deliveryCoveragePincodes ?? [])].filter((p) => /^\d{6}$/.test(p))),
            ];
            for (const pc of coveragePincodes) {
                try {
                    const loc = await this.locations.validatePincode({ pincode: pc });
                    await tx.storeDeliveryArea.create({
                        data: {
                            storeId: created.id,
                            pincode: pc,
                            city: loc.city,
                            state: loc.state,
                            locationPincodeId: loc.id,
                            deliveryFee: dto.deliveryFee,
                            minimumOrder: dto.minOrderAmount,
                            estimatedMinutes: dto.avgPrepTimeMins,
                        },
                    });
                }
                catch {
                }
            }
            return created;
        });
        await this.audit.log({
            actorId: userId,
            action: 'STORE_CREATED',
            resourceType: 'store',
            resourceId: store.id,
            ipAddress,
            metadata: { name: store.name, slug: store.slug },
        });
        this.logger.log({ userId, storeId: store.id, slug }, 'Store created');
        return this.fetchStoreWithRelations(store.id);
    }
    async listStores(userId, dto) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            merchantProfileId: profile.id,
            deletedAt: null,
            ...(dto.status && { status: dto.status }),
        };
        const [stores, total] = await this.prisma.$transaction([
            this.prisma.store.findMany({
                where,
                include: {
                    hours: { orderBy: { dayOfWeek: 'asc' } },
                    storeZones: { include: { zone: { select: { id: true, name: true, slug: true } } } },
                    storeServiceAreas: {
                        include: { serviceArea: { select: { id: true, name: true, slug: true } } },
                    },
                    verificationDocuments: {
                        orderBy: { uploadedAt: 'desc' },
                        select: {
                            id: true,
                            documentType: true,
                            fileName: true,
                            fileUrl: true,
                            mimeType: true,
                            uploadedAt: true,
                        },
                    },
                    documentRequests: {
                        orderBy: { requestedAt: 'desc' },
                        select: {
                            id: true,
                            reason: true,
                            documentTypes: true,
                            requestedAt: true,
                            fulfilledAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.store.count({ where }),
        ]);
        return { stores: stores, total };
    }
    async getStore(userId, storeId) {
        const store = await this.fetchStoreWithRelations(storeId);
        await this.assertOwnership(userId, store);
        return store;
    }
    async updateStore(userId, storeId, dto, ipAddress) {
        const store = await this.fetchStoreWithRelations(storeId);
        await this.assertOwnership(userId, store);
        if (store.status === client_1.StoreStatus.APPROVED) {
            const disallowed = Object.keys(dto).filter((k) => !APPROVED_STORE_EDITABLE_FIELDS.includes(k));
            if (disallowed.length > 0) {
                throw new common_1.ForbiddenException(`Cannot edit ${disallowed.join(', ')} on an approved store. ` +
                    `Contact support if changes are required.`);
            }
        }
        if (store.status === client_1.StoreStatus.PENDING_REVIEW) {
            throw new common_1.ForbiddenException('Store is under review. Withdraw the submission to make edits.');
        }
        if (store.status === client_1.StoreStatus.UNDER_REVIEW) {
            throw new common_1.ForbiddenException('Store is under admin review. Edits are locked.');
        }
        if (store.status === client_1.StoreStatus.DOCUMENTS_REQUIRED) {
            throw new common_1.ForbiddenException('Upload requested documents to continue verification. Store details cannot be edited.');
        }
        if (store.status === client_1.StoreStatus.REJECTED) {
            throw new common_1.ForbiddenException('This store was rejected and cannot be edited until an admin revokes the rejection.');
        }
        if (store.status === client_1.StoreStatus.SUSPENDED) {
            throw new common_1.ForbiddenException('Suspended stores cannot be edited');
        }
        let slug = store.slug;
        if (dto.name && dto.name !== store.name) {
            const profile = await this.merchantService.requireMerchantProfile(userId);
            slug = await this.generateUniqueSlug(profile.id, dto.name, storeId);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.store.update({
                where: { id: storeId },
                data: {
                    ...(dto.name !== undefined && { name: dto.name, slug }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.phone !== undefined && { phone: dto.phone }),
                    ...(dto.email !== undefined && { email: dto.email }),
                    ...(dto.line1 !== undefined && { line1: dto.line1 }),
                    ...(dto.line2 !== undefined && { line2: dto.line2 }),
                    ...(dto.pincode !== undefined && { pincode: dto.pincode }),
                    ...(dto.latitude !== undefined && { latitude: dto.latitude }),
                    ...(dto.longitude !== undefined && { longitude: dto.longitude }),
                    ...(dto.cityId !== undefined && { cityId: dto.cityId }),
                    ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
                    ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
                    ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
                    ...(dto.deliveryFee !== undefined && { deliveryFee: dto.deliveryFee }),
                    ...(dto.avgPrepTimeMins !== undefined && { avgPrepTimeMins: dto.avgPrepTimeMins }),
                },
            });
            if (dto.zoneIds !== undefined) {
                await tx.storeZone.deleteMany({ where: { storeId } });
                if (dto.zoneIds.length) {
                    await tx.storeZone.createMany({
                        data: dto.zoneIds.map((zoneId) => ({ storeId, zoneId })),
                        skipDuplicates: true,
                    });
                }
            }
            if (dto.serviceAreaIds !== undefined) {
                await tx.storeServiceArea.deleteMany({ where: { storeId } });
                if (dto.serviceAreaIds.length) {
                    await tx.storeServiceArea.createMany({
                        data: dto.serviceAreaIds.map((serviceAreaId) => ({ storeId, serviceAreaId })),
                        skipDuplicates: true,
                    });
                }
            }
            if (dto.hours?.length) {
                for (const h of dto.hours) {
                    await tx.storeHour.upsert({
                        where: { storeId_dayOfWeek: { storeId, dayOfWeek: h.dayOfWeek } },
                        update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
                        create: {
                            storeId,
                            dayOfWeek: h.dayOfWeek,
                            openTime: h.openTime,
                            closeTime: h.closeTime,
                            isClosed: h.isClosed,
                        },
                    });
                }
            }
        });
        await this.audit.log({
            actorId: userId,
            action: 'STORE_UPDATED',
            resourceType: 'store',
            resourceId: storeId,
            ipAddress,
            metadata: { changedFields: Object.keys(dto) },
        });
        if (store.status === client_1.StoreStatus.APPROVED) {
            void this.buyerCache.invalidateStoreCache(store.slug);
        }
        return this.fetchStoreWithRelations(storeId);
    }
    async submitForReview(userId, storeId, ipAddress) {
        const store = await this.fetchStoreWithRelations(storeId);
        await this.assertOwnership(userId, store);
        if (store.status !== client_1.StoreStatus.DRAFT) {
            throw new common_1.BadRequestException(`Store cannot be submitted from status: ${store.status}. ` +
                `Only DRAFT stores can be submitted for review.`);
        }
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { id: store.merchantProfileId },
            include: { user: { select: { phone: true, email: true } } },
        });
        await this.blocklist.assertUserNotBlacklisted(userId);
        if (profile) {
            await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);
        }
        await this.assertMerchantNotBlocked(userId, {
            phone: store.phone ?? profile?.user.phone,
            email: store.email ?? profile?.user.email,
            gstNumber: profile?.gstNumber,
            panNumber: profile?.panNumber,
        });
        this.validateSubmissionReadiness(store, profile);
        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                status: client_1.StoreStatus.PENDING_REVIEW,
                submittedAt: new Date(),
                rejectionReason: null,
            },
        });
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'STORE_SUBMITTED',
                resourceType: 'store',
                resourceId: storeId,
                ipAddress,
                metadata: { previousStatus: store.status },
            }),
            this.domainEvents.emit(client_1.DomainEventType.STORE_SUBMITTED, 'store', storeId, { merchantUserId: userId, storeName: store.name }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.log({ userId, storeId }, 'Store submitted for review');
        return this.fetchStoreWithRelations(updated.id);
    }
    async uploadVerificationDocument(userId, storeId, dto, ipAddress) {
        const store = await this.fetchStoreWithRelations(storeId);
        await this.assertOwnership(userId, store);
        if (store.status !== client_1.StoreStatus.DOCUMENTS_REQUIRED) {
            throw new common_1.BadRequestException('Documents can only be uploaded when additional documents are requested.');
        }
        const requestedTypes = this.parseDocumentTypes(store.requestedDocumentTypes);
        if (requestedTypes.length && !requestedTypes.includes(dto.documentType)) {
            throw new common_1.BadRequestException(`Document type ${dto.documentType} was not requested. ` +
                `Requested: ${requestedTypes.join(', ')}`);
        }
        const uploadBase = (0, configuration_1.getConfig)(this.config).storage.uploadPublicUrl;
        (0, trusted_upload_url_util_1.assertTrustedUploadUrl)(dto.fileUrl, uploadBase);
        await this.prisma.storeVerificationDocument.create({
            data: {
                storeId,
                documentType: dto.documentType,
                fileName: dto.fileName,
                fileUrl: dto.fileUrl,
                mimeType: dto.mimeType,
                uploadedBy: userId,
            },
        });
        await this.audit.log({
            actorId: userId,
            action: 'STORE_DOCUMENT_UPLOADED',
            resourceType: 'store',
            resourceId: storeId,
            ipAddress,
            metadata: {
                documentType: dto.documentType,
                fileName: dto.fileName,
            },
        });
        return this.fetchStoreWithRelations(storeId);
    }
    async submitDocumentsForReview(userId, storeId, ipAddress) {
        const store = await this.fetchStoreWithRelations(storeId);
        await this.assertOwnership(userId, store);
        if (store.status !== client_1.StoreStatus.DOCUMENTS_REQUIRED) {
            throw new common_1.BadRequestException('Documents can only be submitted when status is DOCUMENTS_REQUIRED.');
        }
        const requestedTypes = this.parseDocumentTypes(store.requestedDocumentTypes);
        if (!requestedTypes.length) {
            throw new common_1.BadRequestException('No document types were requested for this store.');
        }
        const uploadedTypes = new Set(store.verificationDocuments.map((d) => d.documentType));
        const missing = requestedTypes.filter((t) => !uploadedTypes.has(t));
        if (missing.length) {
            throw new common_1.BadRequestException({
                message: 'Please upload all requested documents before submitting.',
                missingDocuments: missing,
            });
        }
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
            await tx.store.update({
                where: { id: storeId },
                data: { status: client_1.StoreStatus.UNDER_REVIEW },
            });
            await tx.storeDocumentRequest.updateMany({
                where: { storeId, fulfilledAt: null },
                data: { fulfilledAt: now },
            });
        });
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'STORE_DOCUMENTS_SUBMITTED',
                resourceType: 'store',
                resourceId: storeId,
                ipAddress,
                metadata: { documentTypes: requestedTypes },
            }),
            this.domainEvents.emit(client_1.DomainEventType.STORE_DOCUMENTS_SUBMITTED, 'store', storeId, { merchantUserId: userId, storeName: store.name, documentTypes: requestedTypes }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.log({ userId, storeId }, 'Store documents submitted for review');
        return this.fetchStoreWithRelations(storeId);
    }
    async fetchStoreWithRelations(storeId) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId, deletedAt: null },
            include: {
                hours: { orderBy: { dayOfWeek: 'asc' } },
                storeZones: { include: { zone: { select: { id: true, name: true, slug: true } } } },
                storeServiceAreas: {
                    include: { serviceArea: { select: { id: true, name: true, slug: true } } },
                },
                verificationDocuments: {
                    orderBy: { uploadedAt: 'desc' },
                    select: {
                        id: true,
                        documentType: true,
                        fileName: true,
                        fileUrl: true,
                        mimeType: true,
                        uploadedAt: true,
                    },
                },
                documentRequests: {
                    orderBy: { requestedAt: 'desc' },
                    select: {
                        id: true,
                        reason: true,
                        documentTypes: true,
                        requestedAt: true,
                        fulfilledAt: true,
                    },
                },
                merchantProfile: {
                    select: {
                        id: true,
                        businessName: true,
                        isBlacklisted: true,
                        blacklistReason: true,
                    },
                },
            },
        });
        if (!store)
            throw new common_1.NotFoundException(`Store not found: ${storeId}`);
        return store;
    }
    parseDocumentTypes(value) {
        if (!Array.isArray(value))
            return [];
        return value.filter((v) => typeof v === 'string' && Object.values(client_1.StoreDocumentType).includes(v));
    }
    async assertMerchantNotBlocked(userId, input) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { phone: true, email: true },
        });
        await this.blocklist.assertNotBlocked({
            phone: input.phone ?? user?.phone,
            email: input.email ?? user?.email,
            gstNumber: input.gstNumber,
            panNumber: input.panNumber,
        });
    }
    async assertOwnership(userId, store) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        if (store.merchantProfileId !== profile.id) {
            throw new common_1.ForbiddenException('You do not own this store');
        }
    }
    validateSubmissionReadiness(store, profile) {
        const errors = [];
        if (!store.name?.trim())
            errors.push('Store name is required');
        if (!store.line1?.trim())
            errors.push('Store address is required');
        if (!store.pincode?.trim())
            errors.push('Pincode is required');
        if (!store.latitude || !store.longitude)
            errors.push('Store location (lat/lng) is required');
        if (!store.phone?.trim())
            errors.push('Store phone is required');
        if (!store.email?.trim())
            errors.push('Store email is required for billing');
        if (!store.storeZones?.length)
            errors.push('At least one delivery zone must be assigned');
        if (!store.hours?.length)
            errors.push('Store hours must be configured');
        if (!store.logoUrl?.trim())
            errors.push('Store logo (1:1) is required');
        if (!store.bannerUrl?.trim())
            errors.push('Store banner image is required');
        if (!profile?.businessName?.trim())
            errors.push('Business name is required on merchant profile');
        if (!profile?.gstNumber?.trim())
            errors.push('GSTIN is required for billing and tax compliance');
        if (!profile?.panNumber?.trim())
            errors.push('PAN is required for billing and tax compliance');
        if (errors.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Store is not ready for submission',
                errors,
            });
        }
    }
    async generateUniqueSlug(merchantProfileId, name, excludeStoreId) {
        const base = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .slice(0, 50);
        let slug = base;
        let counter = 1;
        while (true) {
            const existing = await this.prisma.store.findFirst({
                where: {
                    merchantProfileId,
                    slug,
                    ...(excludeStoreId && { id: { not: excludeStoreId } }),
                },
            });
            if (!existing)
                return slug;
            slug = `${base}-${counter++}`;
        }
    }
};
exports.StoreService = StoreService;
exports.StoreService = StoreService = StoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        buyer_cache_service_1.BuyerCacheService,
        verification_blocklist_service_1.VerificationBlocklistService,
        location_directory_service_1.LocationDirectoryService,
        config_1.ConfigService])
], StoreService);
//# sourceMappingURL=store.service.js.map