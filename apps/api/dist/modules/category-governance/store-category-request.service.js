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
var StoreCategoryRequestService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreCategoryRequestService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const merchant_service_1 = require("../merchant/merchant.service");
const verification_blocklist_service_1 = require("../merchant/verification-blocklist.service");
const store_category_access_service_1 = require("./store-category-access.service");
const config_1 = require("@nestjs/config");
const configuration_1 = require("../../config/configuration");
const trusted_upload_url_util_1 = require("../../common/utils/trusted-upload-url.util");
const catalog_kind_util_1 = require("./utils/catalog-kind.util");
const vertical_service_1 = require("../store-vertical/vertical.service");
let StoreCategoryRequestService = StoreCategoryRequestService_1 = class StoreCategoryRequestService {
    constructor(prisma, merchantService, blocklist, audit, domainEvents, categoryAccess, config, verticalService) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.blocklist = blocklist;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.categoryAccess = categoryAccess;
        this.config = config;
        this.verticalService = verticalService;
        this.logger = new common_1.Logger(StoreCategoryRequestService_1.name);
    }
    async assertStoreOwned(userId, storeId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
        });
        if (!store)
            throw new common_1.ForbiddenException('Store not found');
        return { profile, store };
    }
    async listCatalog(userId, storeId, catalogKind) {
        await this.assertStoreOwned(userId, storeId);
        await this.verticalService.ensureStoreBusinessTypesFromApplication(storeId);
        const kind = await (0, catalog_kind_util_1.resolveStoreCatalogKind)(this.prisma, storeId, catalogKind);
        const existing = await this.prisma.storeCategoryRequest.findMany({
            where: { storeId },
            select: { categoryId: true, subcategoryId: true, status: true },
        });
        const existingMap = new Map(existing.map((e) => [`${e.categoryId}:${e.subcategoryId}`, e.status]));
        const approved = await this.prisma.storeCategory.findMany({
            where: { storeId },
            select: { categoryId: true, subcategoryId: true },
        });
        const approvedSet = new Set(approved.map((a) => `${a.categoryId}:${a.subcategoryId}`));
        const categories = await this.prisma.category.findMany({
            where: {
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                catalogKind: kind,
                isActive: true,
                deletedAt: null,
                parentId: null,
            },
            include: {
                children: {
                    where: { isActive: true, deletedAt: null, catalogKind: kind },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        return categories.map((c) => ({
            ...c,
            children: c.children.map((ch) => {
                const key = `${c.id}:${ch.id}`;
                return {
                    ...ch,
                    requestStatus: approvedSet.has(key)
                        ? client_1.StoreCategoryRequestStatus.APPROVED
                        : (existingMap.get(key) ?? null),
                };
            }),
        }));
    }
    async listStoreRequests(userId, storeId) {
        await this.assertStoreOwned(userId, storeId);
        return this.prisma.storeCategoryRequest.findMany({
            where: { storeId },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                subcategory: { select: { id: true, name: true, slug: true } },
                store: { select: { id: true, name: true, slug: true } },
                documents: { orderBy: { uploadedAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listApprovedCategories(userId, storeId, catalogKind) {
        await this.assertStoreOwned(userId, storeId);
        const kind = await (0, catalog_kind_util_1.resolveStoreCatalogKind)(this.prisma, storeId, catalogKind);
        return this.categoryAccess.listApprovedCategoryTree(storeId, kind);
    }
    async requestCategoryAccess(userId, storeId, dto, ipAddress) {
        const { profile } = await this.assertStoreOwned(userId, storeId);
        await this.blocklist.assertUserNotBlacklisted(userId);
        await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);
        const expectedKind = await (0, catalog_kind_util_1.resolveStoreCatalogKind)(this.prisma, storeId);
        const parent = await this.prisma.category.findFirst({
            where: {
                id: dto.categoryId,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                catalogKind: expectedKind,
                isActive: true,
                deletedAt: null,
                parentId: null,
            },
        });
        if (!parent)
            throw new common_1.NotFoundException('Parent category not found');
        const subcategory = await this.prisma.category.findFirst({
            where: {
                id: dto.subcategoryId,
                parentId: dto.categoryId,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                catalogKind: expectedKind,
                isActive: true,
                deletedAt: null,
            },
        });
        if (!subcategory) {
            throw new common_1.BadRequestException('Subcategory not found or does not belong to the selected category');
        }
        const existingApproval = await this.prisma.storeCategory.findUnique({
            where: {
                storeId_categoryId_subcategoryId: {
                    storeId,
                    categoryId: dto.categoryId,
                    subcategoryId: dto.subcategoryId,
                },
            },
        });
        if (existingApproval) {
            throw new common_1.ConflictException('This store already has access to this subcategory');
        }
        const existing = await this.prisma.storeCategoryRequest.findUnique({
            where: {
                storeId_categoryId_subcategoryId: {
                    storeId,
                    categoryId: dto.categoryId,
                    subcategoryId: dto.subcategoryId,
                },
            },
        });
        if (existing) {
            if (existing.status === client_1.StoreCategoryRequestStatus.PENDING ||
                existing.status === client_1.StoreCategoryRequestStatus.DOCUMENTS_REQUIRED ||
                existing.status === client_1.StoreCategoryRequestStatus.UNDER_REVIEW) {
                throw new common_1.ConflictException('A request for this subcategory is already pending');
            }
            if (existing.status === client_1.StoreCategoryRequestStatus.APPROVED) {
                throw new common_1.ConflictException('This subcategory is already approved');
            }
            if (existing.status === client_1.StoreCategoryRequestStatus.REJECTED) {
                const updated = await this.prisma.storeCategoryRequest.update({
                    where: { id: existing.id },
                    data: {
                        status: client_1.StoreCategoryRequestStatus.PENDING,
                        reason: dto.reason ?? existing.reason,
                        adminNote: null,
                        reviewedAt: null,
                        reviewedBy: null,
                    },
                    include: {
                        category: true,
                        subcategory: true,
                        store: { select: { id: true, name: true } },
                    },
                });
                await this.emitEvent(userId, updated.id, 'STORE_CATEGORY_REQUEST_RESUBMITTED', ipAddress);
                return updated;
            }
        }
        const created = await this.prisma.storeCategoryRequest.create({
            data: {
                storeId,
                categoryId: dto.categoryId,
                subcategoryId: dto.subcategoryId,
                reason: dto.reason,
                status: client_1.StoreCategoryRequestStatus.PENDING,
            },
            include: {
                category: true,
                subcategory: true,
                store: { select: { id: true, name: true } },
            },
        });
        await this.emitEvent(userId, created.id, 'STORE_CATEGORY_REQUESTED', ipAddress);
        return created;
    }
    async uploadDocument(userId, storeId, requestId, dto, ipAddress) {
        await this.assertStoreOwned(userId, storeId);
        const request = await this.prisma.storeCategoryRequest.findFirst({
            where: { id: requestId, storeId },
        });
        if (!request)
            throw new common_1.NotFoundException('Category request not found');
        if (request.status !== client_1.StoreCategoryRequestStatus.DOCUMENTS_REQUIRED) {
            throw new common_1.BadRequestException('Documents can only be uploaded when additional documents are requested');
        }
        const uploadBase = (0, configuration_1.getConfig)(this.config).storage.uploadPublicUrl;
        (0, trusted_upload_url_util_1.assertTrustedUploadUrl)(dto.fileUrl, uploadBase);
        await this.prisma.storeCategoryRequestDocument.create({
            data: {
                storeCategoryRequestId: requestId,
                documentType: dto.documentType,
                fileName: dto.fileName,
                fileUrl: dto.fileUrl,
                mimeType: dto.mimeType,
                uploadedBy: userId,
            },
        });
        await this.emitEvent(userId, requestId, 'STORE_CATEGORY_DOCUMENT_UPLOADED', ipAddress);
        return this.prisma.storeCategoryRequest.findUnique({
            where: { id: requestId },
            include: {
                category: true,
                subcategory: true,
                store: { select: { id: true, name: true } },
                documents: { orderBy: { uploadedAt: 'desc' } },
            },
        });
    }
    async submitDocuments(userId, storeId, requestId, ipAddress) {
        await this.assertStoreOwned(userId, storeId);
        const request = await this.prisma.storeCategoryRequest.findFirst({
            where: { id: requestId, storeId },
        });
        if (!request)
            throw new common_1.NotFoundException('Category request not found');
        if (request.status !== client_1.StoreCategoryRequestStatus.DOCUMENTS_REQUIRED) {
            throw new common_1.BadRequestException('Documents can only be submitted when status is DOCUMENTS_REQUIRED');
        }
        const docCount = await this.prisma.storeCategoryRequestDocument.count({
            where: { storeCategoryRequestId: requestId },
        });
        if (docCount === 0) {
            throw new common_1.BadRequestException('Upload at least one document before submitting');
        }
        const updated = await this.prisma.storeCategoryRequest.update({
            where: { id: requestId },
            data: { status: client_1.StoreCategoryRequestStatus.UNDER_REVIEW },
            include: {
                category: true,
                subcategory: true,
                store: { select: { id: true, name: true } },
                documents: { orderBy: { uploadedAt: 'desc' } },
            },
        });
        await this.emitEvent(userId, requestId, 'STORE_CATEGORY_DOCUMENTS_SUBMITTED', ipAddress);
        return updated;
    }
    async emitEvent(userId, requestId, action, ipAddress) {
        await this.audit.log({
            actorId: userId,
            action,
            resourceType: 'store_category_request',
            resourceId: requestId,
            ipAddress,
        });
        await this.domainEvents.emit(client_1.DomainEventType.CATEGORY_REQUESTED, 'store_category_request', requestId, { action }, { userId, ipAddress: ipAddress ?? null });
    }
};
exports.StoreCategoryRequestService = StoreCategoryRequestService;
exports.StoreCategoryRequestService = StoreCategoryRequestService = StoreCategoryRequestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        verification_blocklist_service_1.VerificationBlocklistService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        store_category_access_service_1.StoreCategoryAccessService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, vertical_service_1.VerticalService])
], StoreCategoryRequestService);
//# sourceMappingURL=store-category-request.service.js.map