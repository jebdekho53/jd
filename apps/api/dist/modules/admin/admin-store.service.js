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
var AdminStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminStoreService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const rejection_constants_1 = require("../../common/constants/rejection.constants");
const store_service_1 = require("../store/store.service");
const merchant_service_1 = require("../merchant/merchant.service");
const buyer_cache_service_1 = require("../buyer/buyer-cache.service");
const verification_blocklist_service_1 = require("../merchant/verification-blocklist.service");
const email_notification_service_1 = require("../email/email-notification.service");
const APPROVABLE_STATUSES = [
    client_1.StoreStatus.PENDING_REVIEW,
    client_1.StoreStatus.UNDER_REVIEW,
];
const REJECTABLE_STATUSES = [
    client_1.StoreStatus.PENDING_REVIEW,
    client_1.StoreStatus.UNDER_REVIEW,
];
const REQUEST_DOCUMENTS_STATUSES = [
    client_1.StoreStatus.PENDING_REVIEW,
    client_1.StoreStatus.UNDER_REVIEW,
    client_1.StoreStatus.DOCUMENTS_REQUIRED,
];
let AdminStoreService = AdminStoreService_1 = class AdminStoreService {
    constructor(prisma, storeService, audit, domainEvents, buyerCache, blocklist, emailNotifications, merchantService) {
        this.prisma = prisma;
        this.storeService = storeService;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.buyerCache = buyerCache;
        this.blocklist = blocklist;
        this.emailNotifications = emailNotifications;
        this.merchantService = merchantService;
        this.logger = new common_1.Logger(AdminStoreService_1.name);
    }
    async listStoreApprovals(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = dto.blacklisted
            ? {
                deletedAt: null,
                merchantProfile: { isBlacklisted: true },
                ...(dto.cityId && { cityId: dto.cityId }),
            }
            : {
                status: dto.status ?? client_1.StoreStatus.PENDING_REVIEW,
                deletedAt: null,
                ...(dto.cityId && { cityId: dto.cityId }),
            };
        const fifoStatuses = [
            client_1.StoreStatus.PENDING_REVIEW,
            client_1.StoreStatus.DOCUMENTS_REQUIRED,
            client_1.StoreStatus.UNDER_REVIEW,
        ];
        const orderBy = dto.blacklisted
            ? { createdAt: 'desc' }
            : fifoStatuses.includes(dto.status ?? client_1.StoreStatus.PENDING_REVIEW)
                ? { submittedAt: 'asc' }
                : { createdAt: 'desc' };
        const [stores, total] = await this.prisma.$transaction([
            this.prisma.store.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    submittedAt: true,
                    reviewedAt: true,
                    rejectionReason: true,
                    rejectionType: true,
                    reviewedBy: true,
                    documentRequestReason: true,
                    documentRequestAt: true,
                    requestedDocumentTypes: true,
                    cityId: true,
                    pincode: true,
                    line1: true,
                    createdAt: true,
                    merchantProfile: {
                        select: {
                            id: true,
                            businessName: true,
                            gstNumber: true,
                            kycStatus: true,
                            isBlacklisted: true,
                            blacklistReason: true,
                            user: { select: { id: true, phone: true, email: true } },
                        },
                    },
                    _count: { select: { products: true, orders: true } },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.store.count({ where }),
        ]);
        return { stores: stores, total };
    }
    async approveStore(adminUserId, storeId, ipAddress, userAgent) {
        const store = await this.findStoreOrThrow(storeId);
        if (!APPROVABLE_STATUSES.includes(store.status)) {
            throw new common_1.BadRequestException(`Store cannot be approved from status: ${store.status}. ` +
                `Only PENDING_REVIEW or UNDER_REVIEW stores can be approved.`);
        }
        const now = new Date();
        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                reviewedAt: now,
                reviewedBy: adminUserId,
                rejectionReason: null,
                documentRequestReason: null,
                documentRequestAt: null,
                documentRequestBy: null,
                requestedDocumentTypes: client_1.Prisma.JsonNull,
            },
            select: {
                id: true,
                status: true,
                isActive: true,
                reviewedAt: true,
                merchantProfile: { select: { userId: true } },
            },
        });
        if (updated.merchantProfile?.userId) {
            await this.merchantService.ensureMerchantRole(updated.merchantProfile.userId);
        }
        await Promise.all([
            this.audit.log({
                actorId: adminUserId,
                action: 'STORE_APPROVED',
                resourceType: 'store',
                resourceId: storeId,
                ipAddress,
                userAgent,
                metadata: {
                    previousStatus: store.status,
                    storeName: store.name,
                    merchantId: store.merchantProfileId,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.STORE_APPROVED, 'store', storeId, { storeName: store.name, approvedBy: adminUserId }, { userId: adminUserId, ipAddress: ipAddress ?? null }),
        ]);
        await this.buyerCache.invalidateStoreCache(store.slug);
        const merchant = await this.prisma.merchantProfile.findUnique({
            where: { id: store.merchantProfileId },
            select: { userId: true },
        });
        if (merchant) {
            void this.emailNotifications.sendMerchantStoreApproved(merchant.userId, store.name);
        }
        this.logger.log({ adminUserId, storeId, slug: store.slug }, 'Store approved — buyer store cache invalidated');
        return {
            id: updated.id,
            status: updated.status,
            isActive: updated.isActive,
            reviewedAt: updated.reviewedAt,
        };
    }
    async requestDocuments(adminUserId, storeId, dto, ipAddress, userAgent) {
        const store = await this.findStoreOrThrow(storeId);
        if (!REQUEST_DOCUMENTS_STATUSES.includes(store.status)) {
            throw new common_1.BadRequestException(`Documents cannot be requested from status: ${store.status}.`);
        }
        const now = new Date();
        const documentTypes = dto.documentTypes;
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.store.update({
                where: { id: storeId },
                data: {
                    status: client_1.StoreStatus.DOCUMENTS_REQUIRED,
                    documentRequestReason: dto.reason,
                    documentRequestAt: now,
                    documentRequestBy: adminUserId,
                    requestedDocumentTypes: documentTypes,
                },
                select: {
                    id: true,
                    status: true,
                    documentRequestReason: true,
                    requestedDocumentTypes: true,
                },
            });
            await tx.storeDocumentRequest.create({
                data: {
                    storeId,
                    reason: dto.reason,
                    documentTypes,
                    requestedBy: adminUserId,
                },
            });
            return result;
        });
        await Promise.all([
            this.audit.log({
                actorId: adminUserId,
                action: 'STORE_DOCUMENTS_REQUESTED',
                resourceType: 'store',
                resourceId: storeId,
                ipAddress,
                userAgent,
                metadata: {
                    previousStatus: store.status,
                    reason: dto.reason,
                    documentTypes,
                    storeName: store.name,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.STORE_DOCUMENTS_REQUESTED, 'store', storeId, {
                storeName: store.name,
                reason: dto.reason,
                documentTypes,
                requestedBy: adminUserId,
            }, { userId: adminUserId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.log({ adminUserId, storeId }, 'Store documents requested');
        return updated;
    }
    async rejectStore(adminUserId, storeId, dto, ipAddress, userAgent) {
        const store = await this.findStoreWithMerchantOrThrow(storeId);
        if (!REJECTABLE_STATUSES.includes(store.status)) {
            throw new common_1.BadRequestException(`Store cannot be rejected from status: ${store.status}. ` +
                `Only PENDING_REVIEW or UNDER_REVIEW stores can be rejected.`);
        }
        const now = new Date();
        const isPermanent = (0, rejection_constants_1.isBlacklistRejection)(dto.rejectionType);
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.store.update({
                where: { id: storeId },
                data: {
                    status: client_1.StoreStatus.REJECTED,
                    isActive: false,
                    reviewedAt: now,
                    reviewedBy: adminUserId,
                    rejectionReason: dto.reason,
                    rejectionType: dto.rejectionType,
                    rejectionRevokedAt: null,
                    rejectionRevokedBy: null,
                    rejectionRevokeReason: null,
                    documentRequestReason: null,
                    documentRequestAt: null,
                    documentRequestBy: null,
                    requestedDocumentTypes: client_1.Prisma.JsonNull,
                },
                select: {
                    id: true,
                    status: true,
                    rejectionReason: true,
                    rejectionType: true,
                },
            });
            if (isPermanent) {
                await tx.merchantProfile.update({
                    where: { id: store.merchantProfileId },
                    data: {
                        isBlacklisted: true,
                        blacklistReason: dto.reason,
                        blacklistedAt: now,
                        blacklistedBy: adminUserId,
                        blacklistRemovedAt: null,
                        blacklistRemovedBy: null,
                    },
                });
            }
            return result;
        });
        if (isPermanent) {
            await this.blocklist.blockMerchantIdentifiers({
                phone: store.merchantProfile.user.phone,
                email: store.merchantProfile.user.email ?? store.email,
                gstNumber: store.merchantProfile.gstNumber,
                panNumber: store.merchantProfile.panNumber,
            }, dto.reason, adminUserId, storeId);
            if (store.phone && store.phone !== store.merchantProfile.user.phone) {
                await this.blocklist.blockMerchantIdentifiers({ phone: store.phone }, dto.reason, adminUserId, storeId);
            }
            await this.domainEvents.emit(client_1.DomainEventType.MERCHANT_BLACKLISTED, 'merchant_profile', store.merchantProfileId, {
                storeId,
                storeName: store.name,
                reason: dto.reason,
                rejectionType: dto.rejectionType,
                blacklistedBy: adminUserId,
            }, { userId: adminUserId, ipAddress: ipAddress ?? null });
            await this.audit.log({
                actorId: adminUserId,
                action: 'MERCHANT_BLACKLISTED',
                resourceType: 'merchant_profile',
                resourceId: store.merchantProfileId,
                ipAddress,
                userAgent,
                metadata: {
                    storeId,
                    rejectionType: dto.rejectionType,
                    reason: dto.reason,
                },
            });
        }
        await Promise.all([
            this.audit.log({
                actorId: adminUserId,
                action: 'STORE_REJECTED',
                resourceType: 'store',
                resourceId: storeId,
                ipAddress,
                userAgent,
                metadata: {
                    previousStatus: store.status,
                    reason: dto.reason,
                    rejectionType: dto.rejectionType,
                    revocable: (0, rejection_constants_1.isRevocableRejection)(dto.rejectionType),
                    blacklisted: isPermanent,
                    storeName: store.name,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.STORE_REJECTED, 'store', storeId, {
                storeName: store.name,
                reason: dto.reason,
                rejectionType: dto.rejectionType,
                rejectedBy: adminUserId,
                revocable: (0, rejection_constants_1.isRevocableRejection)(dto.rejectionType),
                blacklisted: isPermanent,
            }, { userId: adminUserId, ipAddress: ipAddress ?? null }),
        ]);
        await this.buyerCache.invalidateStoreCache(store.slug);
        const rejectedMerchant = await this.prisma.merchantProfile.findUnique({
            where: { id: store.merchantProfileId },
            select: { userId: true },
        });
        if (rejectedMerchant) {
            void this.emailNotifications.sendMerchantStoreRejected(rejectedMerchant.userId, store.name, dto.reason);
        }
        this.logger.log({ adminUserId, storeId, rejectionType: dto.rejectionType }, 'Store rejected');
        return updated;
    }
    async revokeRejection(adminUserId, storeId, dto, ipAddress, userAgent) {
        const store = await this.findStoreWithMerchantOrThrow(storeId);
        if (store.status !== client_1.StoreStatus.REJECTED) {
            throw new common_1.BadRequestException('Only REJECTED stores can have their rejection revoked.');
        }
        if (!(0, rejection_constants_1.isRevocableRejection)(store.rejectionType)) {
            throw new common_1.BadRequestException(`Rejection type ${store.rejectionType ?? 'unknown'} cannot be revoked. ` +
                'Only DOCUMENT_ISSUE and COMPLIANCE_ISSUE rejections are revocable.');
        }
        if (store.merchantProfile.isBlacklisted) {
            throw new common_1.BadRequestException('Cannot revoke rejection for a blacklisted merchant. SUPER_ADMIN must remove the blacklist first.');
        }
        const now = new Date();
        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                status: client_1.StoreStatus.UNDER_REVIEW,
                isActive: false,
                reviewedAt: now,
                reviewedBy: adminUserId,
                rejectionRevokedAt: now,
                rejectionRevokedBy: adminUserId,
                rejectionRevokeReason: dto.reason,
            },
            select: { id: true, status: true },
        });
        await Promise.all([
            this.audit.log({
                actorId: adminUserId,
                action: 'STORE_REJECTION_REVOKED',
                resourceType: 'store',
                resourceId: storeId,
                ipAddress,
                userAgent,
                metadata: {
                    reason: dto.reason,
                    previousRejectionType: store.rejectionType,
                    previousRejectionReason: store.rejectionReason,
                    storeName: store.name,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.STORE_REJECTION_REVOKED, 'store', storeId, {
                storeName: store.name,
                reason: dto.reason,
                revokedBy: adminUserId,
                previousRejectionType: store.rejectionType,
            }, { userId: adminUserId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.log({ adminUserId, storeId }, 'Store rejection revoked');
        return updated;
    }
    async suspendStore(adminUserId, storeId, dto, ipAddress, userAgent) {
        const store = await this.findStoreOrThrow(storeId);
        if (store.status !== client_1.StoreStatus.APPROVED) {
            throw new common_1.BadRequestException(`Only APPROVED stores can be suspended. Current status: ${store.status}`);
        }
        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                status: client_1.StoreStatus.SUSPENDED,
                isActive: false,
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
                rejectionReason: dto.reason,
            },
            select: { id: true, status: true, isActive: true },
        });
        await Promise.all([
            this.audit.log({
                actorId: adminUserId,
                action: 'STORE_SUSPENDED',
                resourceType: 'store',
                resourceId: storeId,
                ipAddress,
                userAgent,
                metadata: {
                    reason: dto.reason,
                    storeName: store.name,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.STORE_SUSPENDED, 'store', storeId, { storeName: store.name, reason: dto.reason, suspendedBy: adminUserId }, { userId: adminUserId, ipAddress: ipAddress ?? null }),
        ]);
        await this.buyerCache.invalidateStoreCache(store.slug);
        this.logger.log({ adminUserId, storeId }, 'Store suspended');
        return updated;
    }
    async reinstateStore(adminUserId, storeId, ipAddress, userAgent) {
        const store = await this.findStoreOrThrow(storeId);
        if (store.status !== client_1.StoreStatus.SUSPENDED) {
            throw new common_1.BadRequestException(`Only SUSPENDED stores can be reinstated. Current status: ${store.status}`);
        }
        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
                rejectionReason: null,
            },
            select: { id: true, status: true, isActive: true },
        });
        await this.audit.log({
            actorId: adminUserId,
            action: 'STORE_REINSTATED',
            resourceType: 'store',
            resourceId: storeId,
            ipAddress,
            userAgent,
            metadata: { storeName: store.name },
        });
        await this.buyerCache.invalidateStoreCache(store.slug);
        this.logger.log({ adminUserId, storeId }, 'Store reinstated');
        return updated;
    }
    async deleteStore(adminUserId, storeId, dto, ipAddress, userAgent) {
        const store = await this.findStoreOrThrow(storeId);
        const now = new Date();
        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                deletedAt: now,
                isActive: false,
                reviewedAt: now,
                reviewedBy: adminUserId,
                rejectionReason: dto.reason,
            },
            select: { id: true, deletedAt: true },
        });
        await Promise.all([
            this.audit.log({
                actorId: adminUserId,
                action: 'STORE_DELETED',
                resourceType: 'store',
                resourceId: storeId,
                ipAddress,
                userAgent,
                metadata: {
                    reason: dto.reason,
                    storeName: store.name,
                    previousStatus: store.status,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.STORE_SUSPENDED, 'store', storeId, { storeName: store.name, reason: dto.reason, deletedBy: adminUserId, deleted: true }, { userId: adminUserId, ipAddress: ipAddress ?? null }),
        ]);
        await this.buyerCache.invalidateStoreCache(store.slug);
        this.logger.log({ adminUserId, storeId }, 'Store soft-deleted');
        return { id: updated.id, deletedAt: updated.deletedAt };
    }
    async getStoreDetail(storeId) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId, deletedAt: null },
            include: {
                storeZones: {
                    include: { zone: { select: { id: true, name: true, slug: true } } },
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
                        gstNumber: true,
                        panNumber: true,
                        kycStatus: true,
                        isBlacklisted: true,
                        blacklistReason: true,
                        user: { select: { id: true, phone: true, email: true } },
                    },
                },
            },
        });
        if (!store) {
            throw new common_1.NotFoundException(`Store not found: ${storeId}`);
        }
        return store;
    }
    async findStoreOrThrow(storeId) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId, deletedAt: null },
            select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                merchantProfileId: true,
                isActive: true,
            },
        });
        if (!store)
            throw new common_1.NotFoundException(`Store not found: ${storeId}`);
        return store;
    }
    async findStoreWithMerchantOrThrow(storeId) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId, deletedAt: null },
            select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                merchantProfileId: true,
                isActive: true,
                phone: true,
                email: true,
                merchantProfile: {
                    select: {
                        id: true,
                        gstNumber: true,
                        panNumber: true,
                        isBlacklisted: true,
                        user: { select: { phone: true, email: true } },
                    },
                },
                rejectionReason: true,
                rejectionType: true,
            },
        });
        if (!store)
            throw new common_1.NotFoundException(`Store not found: ${storeId}`);
        return store;
    }
};
exports.AdminStoreService = AdminStoreService;
exports.AdminStoreService = AdminStoreService = AdminStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        store_service_1.StoreService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        buyer_cache_service_1.BuyerCacheService,
        verification_blocklist_service_1.VerificationBlocklistService,
        email_notification_service_1.EmailNotificationService,
        merchant_service_1.MerchantService])
], AdminStoreService);
//# sourceMappingURL=admin-store.service.js.map