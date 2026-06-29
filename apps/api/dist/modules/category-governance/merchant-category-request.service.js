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
var MerchantCategoryRequestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantCategoryRequestService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const merchant_service_1 = require("../merchant/merchant.service");
const verification_blocklist_service_1 = require("../merchant/verification-blocklist.service");
const merchant_category_access_service_1 = require("./merchant-category-access.service");
let MerchantCategoryRequestService = MerchantCategoryRequestService_1 = class MerchantCategoryRequestService {
    constructor(prisma, merchantService, blocklist, audit, domainEvents, categoryAccess) {
        this.prisma = prisma;
        this.merchantService = merchantService;
        this.blocklist = blocklist;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.categoryAccess = categoryAccess;
        this.logger = new common_1.Logger(MerchantCategoryRequestService_1.name);
    }
    async listCatalog(userId) {
        await this.merchantService.requireMerchantProfile(userId);
        const profile = await this.merchantService.getProfile(userId);
        const existing = await this.prisma.merchantCategory.findMany({
            where: { merchantProfileId: profile.id },
            select: { categoryId: true, status: true },
        });
        const existingMap = new Map(existing.map((e) => [e.categoryId, e.status]));
        const categories = await this.prisma.category.findMany({
            where: {
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                isActive: true,
                deletedAt: null,
                parentId: null,
            },
            include: {
                children: {
                    where: { isActive: true, deletedAt: null },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        return categories.map((c) => ({
            ...c,
            requestStatus: existingMap.get(c.id) ?? null,
            children: c.children.map((ch) => ({
                ...ch,
                requestStatus: existingMap.get(ch.id) ?? null,
            })),
        }));
    }
    async listMyRequests(userId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        return this.prisma.merchantCategory.findMany({
            where: { merchantProfileId: profile.id },
            include: {
                category: {
                    include: { parent: { select: { id: true, name: true, slug: true } } },
                },
                documents: { orderBy: { uploadedAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async requestCategoryAccess(userId, dto, ipAddress) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        await this.blocklist.assertUserNotBlacklisted(userId);
        await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);
        const category = await this.prisma.category.findFirst({
            where: {
                id: dto.categoryId,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                isActive: true,
                deletedAt: null,
            },
        });
        if (!category)
            throw new common_1.NotFoundException('Category not found');
        const existing = await this.prisma.merchantCategory.findUnique({
            where: {
                merchantProfileId_categoryId: {
                    merchantProfileId: profile.id,
                    categoryId: dto.categoryId,
                },
            },
        });
        if (existing) {
            if (existing.status === client_1.MerchantCategoryStatus.APPROVED) {
                throw new common_1.ConflictException('You already have access to this category');
            }
            if (existing.status === client_1.MerchantCategoryStatus.PENDING ||
                existing.status === client_1.MerchantCategoryStatus.DOCUMENTS_REQUIRED) {
                throw new common_1.ConflictException('A request for this category is already in progress');
            }
            if (existing.status === client_1.MerchantCategoryStatus.REJECTED) {
                throw new common_1.BadRequestException('This category was rejected. Contact admin to revoke the rejection before reapplying.');
            }
        }
        const request = await this.prisma.merchantCategory.create({
            data: {
                merchantProfileId: profile.id,
                categoryId: dto.categoryId,
                status: client_1.MerchantCategoryStatus.PENDING,
                requestNote: dto.requestNote,
                submittedAt: new Date(),
            },
            include: { category: true },
        });
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'CATEGORY_REQUESTED',
                resourceType: 'merchant_category',
                resourceId: request.id,
                ipAddress,
                metadata: {
                    merchantProfileId: profile.id,
                    requestingUserId: userId,
                    categoryId: dto.categoryId,
                    categoryName: category.name,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.CATEGORY_REQUESTED, 'merchant_category', request.id, {
                merchantProfileId: profile.id,
                categoryId: dto.categoryId,
                categoryName: category.name,
            }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.log({ userId, merchantProfileId: profile.id, requestId: request.id }, 'Category access requested');
        return request;
    }
    async uploadDocument(userId, requestId, dto, ipAddress) {
        const request = await this.assertRequestOwnership(userId, requestId);
        if (request.status !== client_1.MerchantCategoryStatus.DOCUMENTS_REQUIRED) {
            throw new common_1.BadRequestException('Documents can only be uploaded when additional documents are requested');
        }
        const requestedTypes = this.parseDocumentTypes(request.requestedDocumentTypes);
        if (requestedTypes.length && !requestedTypes.includes(dto.documentType)) {
            throw new common_1.BadRequestException(`Document type ${dto.documentType} was not requested`);
        }
        await this.prisma.merchantCategoryDocument.create({
            data: {
                merchantCategoryId: requestId,
                documentType: dto.documentType,
                fileName: dto.fileName,
                fileUrl: dto.fileUrl,
                mimeType: dto.mimeType,
                uploadedBy: userId,
            },
        });
        return this.getRequestForMerchant(userId, requestId);
    }
    async submitDocuments(userId, requestId, ipAddress) {
        const request = await this.assertRequestOwnership(userId, requestId);
        if (request.status !== client_1.MerchantCategoryStatus.DOCUMENTS_REQUIRED) {
            throw new common_1.BadRequestException('Documents can only be submitted when status is DOCUMENTS_REQUIRED');
        }
        const requestedTypes = this.parseDocumentTypes(request.requestedDocumentTypes);
        const docs = await this.prisma.merchantCategoryDocument.findMany({
            where: { merchantCategoryId: requestId },
        });
        const uploaded = new Set(docs.map((d) => d.documentType));
        const missing = requestedTypes.filter((t) => !uploaded.has(t));
        if (missing.length) {
            throw new common_1.BadRequestException({
                message: 'Please upload all requested documents before submitting',
                missingDocuments: missing,
            });
        }
        return this.prisma.merchantCategory.update({
            where: { id: requestId },
            data: { status: client_1.MerchantCategoryStatus.PENDING, submittedAt: new Date() },
            include: {
                category: true,
                documents: { orderBy: { uploadedAt: 'desc' } },
            },
        });
    }
    async listApprovedCategories(userId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        return this.categoryAccess.listApprovedCategoryTree(profile.id);
    }
    async getRequestForMerchant(userId, requestId) {
        await this.assertRequestOwnership(userId, requestId);
        return this.prisma.merchantCategory.findUnique({
            where: { id: requestId },
            include: {
                category: {
                    include: { parent: { select: { id: true, name: true, slug: true } } },
                },
                documents: { orderBy: { uploadedAt: 'desc' } },
            },
        });
    }
    async assertRequestOwnership(userId, requestId) {
        const profile = await this.merchantService.requireMerchantProfile(userId);
        const request = await this.prisma.merchantCategory.findFirst({
            where: { id: requestId, merchantProfileId: profile.id },
        });
        if (!request)
            throw new common_1.NotFoundException('Category request not found');
        return request;
    }
    parseDocumentTypes(value) {
        if (!Array.isArray(value))
            return [];
        return value.filter((v) => Object.values(client_1.StoreDocumentType).includes(v));
    }
};
exports.MerchantCategoryRequestService = MerchantCategoryRequestService;
exports.MerchantCategoryRequestService = MerchantCategoryRequestService = MerchantCategoryRequestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_service_1.MerchantService,
        verification_blocklist_service_1.VerificationBlocklistService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        merchant_category_access_service_1.MerchantCategoryAccessService])
], MerchantCategoryRequestService);
//# sourceMappingURL=merchant-category-request.service.js.map