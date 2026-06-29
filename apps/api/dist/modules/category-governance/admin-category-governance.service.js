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
var AdminCategoryGovernanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCategoryGovernanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const buyer_cache_service_1 = require("../buyer/buyer-cache.service");
let AdminCategoryGovernanceService = AdminCategoryGovernanceService_1 = class AdminCategoryGovernanceService {
    constructor(prisma, audit, domainEvents, buyerCache) {
        this.prisma = prisma;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.buyerCache = buyerCache;
        this.logger = new common_1.Logger(AdminCategoryGovernanceService_1.name);
    }
    async listGlobalCategories() {
        return this.prisma.category.findMany({
            where: { storeId: null, scope: client_1.CategoryScope.GLOBAL, deletedAt: null, parentId: null },
            include: {
                children: {
                    where: { deletedAt: null },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
    }
    async getGlobalCategory(categoryId) {
        const category = await this.prisma.category.findFirst({
            where: {
                id: categoryId,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                deletedAt: null,
            },
            include: {
                children: {
                    where: { deletedAt: null },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        if (!category)
            throw new common_1.NotFoundException('Global category not found');
        return category;
    }
    async createGlobalCategory(dto, adminUserId) {
        if (dto.parentId) {
            const parent = await this.prisma.category.findFirst({
                where: {
                    id: dto.parentId,
                    storeId: null,
                    scope: client_1.CategoryScope.GLOBAL,
                    deletedAt: null,
                },
            });
            if (!parent)
                throw new common_1.NotFoundException('Parent category not found');
        }
        const catalogKind = dto.catalogKind ??
            (dto.parentId
                ? (await this.prisma.category.findFirst({
                    where: { id: dto.parentId },
                    select: { catalogKind: true },
                }))?.catalogKind ?? client_1.CategoryCatalogKind.PRODUCT
                : client_1.CategoryCatalogKind.PRODUCT);
        const slug = this.toSlug(dto.name);
        const existing = await this.prisma.category.findFirst({
            where: {
                storeId: null,
                slug,
                parentId: dto.parentId ?? null,
                deletedAt: null,
            },
        });
        if (existing)
            throw new common_1.ConflictException(`Category slug "${slug}" already exists`);
        const created = await this.prisma.category.create({
            data: {
                name: dto.name,
                slug,
                parentId: dto.parentId,
                imageUrl: dto.imageUrl,
                icon: dto.icon,
                description: dto.description,
                sortOrder: dto.sortOrder ?? 0,
                scope: client_1.CategoryScope.GLOBAL,
                catalogKind,
                isActive: true,
            },
            include: { children: { where: { deletedAt: null } } },
        });
        await this.emitCatalogEvent('CATEGORY_CREATED', adminUserId, created.id, {
            name: created.name,
            parentId: created.parentId,
            isSubcategory: Boolean(created.parentId),
        });
        await this.invalidateBuyerCategoryCache();
        return created;
    }
    async updateGlobalCategory(categoryId, dto, adminUserId) {
        const category = await this.prisma.category.findFirst({
            where: {
                id: categoryId,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                deletedAt: null,
            },
        });
        if (!category)
            throw new common_1.NotFoundException('Global category not found');
        const nextImageUrl = dto.imageUrl !== undefined ? dto.imageUrl : category.imageUrl;
        const nextIsActive = dto.isActive !== undefined ? dto.isActive : category.isActive;
        if (nextIsActive && !nextImageUrl) {
            throw new common_1.BadRequestException('Category image is required for active categories');
        }
        if (dto.imageUrl === null || dto.imageUrl === '') {
            throw new common_1.BadRequestException('Category image cannot be removed');
        }
        if (dto.name && dto.name !== category.name) {
            const slug = this.toSlug(dto.name);
            const conflict = await this.prisma.category.findFirst({
                where: {
                    storeId: null,
                    slug,
                    parentId: category.parentId,
                    deletedAt: null,
                    id: { not: categoryId },
                },
            });
            if (conflict)
                throw new common_1.ConflictException(`Category slug "${slug}" already exists`);
        }
        const slug = dto.name && dto.name !== category.name ? this.toSlug(dto.name) : undefined;
        const updated = await this.prisma.category.update({
            where: { id: categoryId },
            data: {
                ...(dto.name !== undefined && { name: dto.name, slug: slug ?? category.slug }),
                ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
                ...(dto.icon !== undefined && { icon: dto.icon }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
            include: { children: { where: { deletedAt: null } } },
        });
        await this.emitCatalogEvent('CATEGORY_UPDATED', adminUserId, categoryId, {
            name: updated.name,
            isActive: updated.isActive,
            sortOrder: updated.sortOrder,
        });
        await this.invalidateBuyerCategoryCache();
        return updated;
    }
    async softDeleteGlobalCategory(categoryId, adminUserId) {
        const category = await this.prisma.category.findFirst({
            where: {
                id: categoryId,
                storeId: null,
                scope: client_1.CategoryScope.GLOBAL,
                deletedAt: null,
            },
            include: { children: { where: { deletedAt: null }, select: { id: true } } },
        });
        if (!category)
            throw new common_1.NotFoundException('Global category not found');
        const now = new Date();
        const idsToDelete = [categoryId, ...category.children.map((c) => c.id)];
        await this.prisma.category.updateMany({
            where: { id: { in: idsToDelete } },
            data: { deletedAt: now, isActive: false },
        });
        await this.emitCatalogEvent('CATEGORY_DELETED', adminUserId, categoryId, {
            name: category.name,
            cascadedChildIds: category.children.map((c) => c.id),
        });
        await this.invalidateBuyerCategoryCache();
        return { id: categoryId, deletedAt: now, cascadedCount: category.children.length };
    }
    async listCategoryRequests(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            ...(dto.status && { status: dto.status }),
            ...(dto.storeId && { storeId: dto.storeId }),
        };
        const [requests, total] = await this.prisma.$transaction([
            this.prisma.storeCategoryRequest.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true, slug: true, catalogKind: true } },
                    subcategory: { select: { id: true, name: true, slug: true, catalogKind: true } },
                    store: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            merchantProfile: {
                                select: {
                                    id: true,
                                    businessName: true,
                                    gstNumber: true,
                                    user: { select: { id: true, phone: true, email: true } },
                                },
                            },
                        },
                    },
                    documents: { orderBy: { uploadedAt: 'desc' } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.storeCategoryRequest.count({ where }),
        ]);
        return { requests, total };
    }
    async getCategoryRequest(requestId) {
        const request = await this.prisma.storeCategoryRequest.findUnique({
            where: { id: requestId },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                subcategory: { select: { id: true, name: true, slug: true } },
                store: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        merchantProfile: {
                            select: {
                                id: true,
                                businessName: true,
                                gstNumber: true,
                                panNumber: true,
                                user: { select: { id: true, phone: true, email: true } },
                            },
                        },
                    },
                },
                documents: { orderBy: { uploadedAt: 'desc' } },
            },
        });
        if (!request)
            throw new common_1.NotFoundException('Category request not found');
        return request;
    }
    async approveCategoryRequest(requestId, adminUserId, ipAddress) {
        const request = await this.findStoreRequestOrThrow(requestId);
        const approvable = [
            client_1.StoreCategoryRequestStatus.PENDING,
            client_1.StoreCategoryRequestStatus.DOCUMENTS_REQUIRED,
            client_1.StoreCategoryRequestStatus.UNDER_REVIEW,
        ];
        if (!approvable.includes(request.status)) {
            throw new common_1.BadRequestException(`Cannot approve request in status: ${request.status}`);
        }
        const [updated] = await this.prisma.$transaction([
            this.prisma.storeCategoryRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.StoreCategoryRequestStatus.APPROVED,
                    reviewedAt: new Date(),
                    reviewedBy: adminUserId,
                    adminNote: null,
                },
                include: {
                    category: true,
                    subcategory: true,
                    store: { select: { id: true, name: true, slug: true } },
                },
            }),
            this.prisma.storeCategory.upsert({
                where: {
                    storeId_categoryId_subcategoryId: {
                        storeId: request.storeId,
                        categoryId: request.categoryId,
                        subcategoryId: request.subcategoryId,
                    },
                },
                create: {
                    storeId: request.storeId,
                    categoryId: request.categoryId,
                    subcategoryId: request.subcategoryId,
                    approvedBy: adminUserId,
                },
                update: {
                    approvedBy: adminUserId,
                    approvedAt: new Date(),
                },
            }),
        ]);
        await this.emitStoreGovernanceEvent('STORE_CATEGORY_APPROVED', adminUserId, requestId, {
            storeId: request.storeId,
            categoryId: request.categoryId,
            subcategoryId: request.subcategoryId,
        }, ipAddress);
        await this.invalidateBuyerCategoryCache(request.storeId);
        return updated;
    }
    async rejectCategoryRequest(requestId, adminUserId, dto, ipAddress) {
        const request = await this.findStoreRequestOrThrow(requestId);
        const rejectable = [
            client_1.StoreCategoryRequestStatus.PENDING,
            client_1.StoreCategoryRequestStatus.UNDER_REVIEW,
        ];
        if (!rejectable.includes(request.status)) {
            throw new common_1.BadRequestException(`Cannot reject request in status: ${request.status}. Document requests must be reviewed, not rejected.`);
        }
        const updated = await this.prisma.storeCategoryRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.StoreCategoryRequestStatus.REJECTED,
                adminNote: dto.reason,
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
            },
            include: {
                category: true,
                subcategory: true,
                store: { select: { id: true, name: true } },
            },
        });
        await this.emitStoreGovernanceEvent('STORE_CATEGORY_REJECTED', adminUserId, requestId, {
            storeId: request.storeId,
            categoryId: request.categoryId,
            subcategoryId: request.subcategoryId,
            reason: dto.reason,
        }, ipAddress);
        return updated;
    }
    async requestCategoryDocuments(requestId, adminUserId, dto, ipAddress) {
        const request = await this.findStoreRequestOrThrow(requestId);
        if (request.status !== client_1.StoreCategoryRequestStatus.PENDING &&
            request.status !== client_1.StoreCategoryRequestStatus.UNDER_REVIEW) {
            throw new common_1.BadRequestException(`Cannot request documents for status: ${request.status}`);
        }
        const updated = await this.prisma.storeCategoryRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.StoreCategoryRequestStatus.DOCUMENTS_REQUIRED,
                adminNote: dto.reason,
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
            },
            include: { category: true, subcategory: true },
        });
        await this.emitStoreGovernanceEvent('STORE_CATEGORY_DOCUMENTS_REQUIRED', adminUserId, requestId, {
            storeId: request.storeId,
            categoryId: request.categoryId,
            reason: dto.reason,
            documentTypes: dto.documentTypes ?? [],
        }, ipAddress);
        return updated;
    }
    async moveCategoryRequestToReview(requestId, adminUserId, ipAddress) {
        const request = await this.findStoreRequestOrThrow(requestId);
        if (request.status !== client_1.StoreCategoryRequestStatus.PENDING) {
            throw new common_1.BadRequestException(`Only pending requests can be moved to review (current: ${request.status})`);
        }
        const updated = await this.prisma.storeCategoryRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.StoreCategoryRequestStatus.UNDER_REVIEW,
                reviewedAt: new Date(),
                reviewedBy: adminUserId,
            },
            include: { category: true, subcategory: true },
        });
        await this.emitStoreGovernanceEvent('STORE_CATEGORY_MOVED_TO_REVIEW', adminUserId, requestId, {
            storeId: request.storeId,
            categoryId: request.categoryId,
        }, ipAddress);
        await this.invalidateCategoryCaches(request.storeId);
        return updated;
    }
    async revokeCategoryApproval(requestId, adminUserId, dto, ipAddress) {
        const request = await this.findStoreRequestOrThrow(requestId);
        if (request.status !== client_1.StoreCategoryRequestStatus.APPROVED) {
            throw new common_1.BadRequestException('Only approved category grants can be revoked');
        }
        const [updated] = await this.prisma.$transaction([
            this.prisma.storeCategoryRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.StoreCategoryRequestStatus.REVOKED,
                    adminNote: dto.reason,
                    reviewedAt: new Date(),
                    reviewedBy: adminUserId,
                },
                include: { category: true, subcategory: true },
            }),
            this.prisma.storeCategory.deleteMany({
                where: {
                    storeId: request.storeId,
                    categoryId: request.categoryId,
                    subcategoryId: request.subcategoryId,
                },
            }),
        ]);
        await this.emitStoreGovernanceEvent('STORE_CATEGORY_REVOKED', adminUserId, requestId, {
            storeId: request.storeId,
            categoryId: request.categoryId,
            subcategoryId: request.subcategoryId,
            reason: dto.reason,
        }, ipAddress);
        await this.invalidateCategoryCaches(request.storeId);
        return updated;
    }
    async bulkCategoryRequestAction(requestIds, action, adminUserId, payload, ipAddress) {
        const results = [];
        for (const id of requestIds) {
            try {
                if (action === 'approve') {
                    await this.approveCategoryRequest(id, adminUserId, ipAddress);
                }
                else if (action === 'reject') {
                    await this.rejectCategoryRequest(id, adminUserId, { reason: payload.reason ?? 'Rejected' }, ipAddress);
                }
                else if (action === 'request-documents') {
                    await this.requestCategoryDocuments(id, adminUserId, {
                        reason: payload.reason ?? 'Documents required',
                        documentTypes: payload.documentTypes,
                    }, ipAddress);
                }
                else {
                    await this.moveCategoryRequestToReview(id, adminUserId, ipAddress);
                }
                results.push({ id, ok: true });
            }
            catch (err) {
                results.push({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
            }
        }
        return { results, succeeded: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
    }
    async revokeCategoryRejection(requestId, adminUserId, dto, ipAddress) {
        const request = await this.findStoreRequestOrThrow(requestId);
        if (request.status !== client_1.StoreCategoryRequestStatus.REJECTED) {
            throw new common_1.BadRequestException('Only rejected requests can be reopened');
        }
        const updated = await this.prisma.storeCategoryRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.StoreCategoryRequestStatus.PENDING,
                adminNote: dto.reason,
                reviewedAt: null,
                reviewedBy: null,
            },
            include: { category: true, subcategory: true },
        });
        await this.emitStoreGovernanceEvent('STORE_CATEGORY_REJECTION_REVOKED', adminUserId, requestId, {
            storeId: request.storeId,
            categoryId: request.categoryId,
            reason: dto.reason,
        }, ipAddress);
        return updated;
    }
    async getCategoryStatistics() {
        const [parentCount, subCount, requestsByStatus, topByProducts, storesPerCategory,] = await Promise.all([
            this.prisma.category.count({
                where: { scope: client_1.CategoryScope.GLOBAL, deletedAt: null, parentId: null },
            }),
            this.prisma.category.count({
                where: { scope: client_1.CategoryScope.GLOBAL, deletedAt: null, parentId: { not: null } },
            }),
            this.prisma.storeCategoryRequest.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            this.prisma.product.groupBy({
                by: ['categoryId'],
                where: { deletedAt: null, categoryId: { not: null }, isActive: true },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            this.prisma.storeCategory.groupBy({
                by: ['categoryId'],
                _count: { storeId: true },
                orderBy: { _count: { storeId: 'desc' } },
                take: 10,
            }),
        ]);
        const categoryIds = [
            ...topByProducts.map((u) => u.categoryId),
            ...storesPerCategory.map((s) => s.categoryId),
        ];
        const categoryNames = await this.prisma.category.findMany({
            where: { id: { in: [...new Set(categoryIds)] } },
            select: { id: true, name: true, parentId: true },
        });
        const requestMap = Object.fromEntries(requestsByStatus.map((r) => [r.status, r._count.id]));
        return {
            totalCategories: parentCount,
            totalSubcategories: subCount,
            pendingRequests: requestMap.PENDING ?? 0,
            underReviewRequests: requestMap.UNDER_REVIEW ?? 0,
            approvedRequests: requestMap.APPROVED ?? 0,
            rejectedRequests: requestMap.REJECTED ?? 0,
            revokedRequests: requestMap.REVOKED ?? 0,
            documentsRequiredRequests: requestMap.DOCUMENTS_REQUIRED ?? 0,
            topCategories: topByProducts.map((u) => ({
                categoryId: u.categoryId,
                name: categoryNames.find((c) => c.id === u.categoryId)?.name ?? 'Unknown',
                productCount: u._count.id,
            })),
            storesPerCategory: storesPerCategory.map((s) => ({
                categoryId: s.categoryId,
                name: categoryNames.find((c) => c.id === s.categoryId)?.name ?? 'Unknown',
                storeCount: s._count.storeId,
            })),
        };
    }
    async findStoreRequestOrThrow(requestId) {
        const request = await this.prisma.storeCategoryRequest.findUnique({
            where: { id: requestId },
        });
        if (!request)
            throw new common_1.NotFoundException('Category request not found');
        return request;
    }
    async emitCatalogEvent(action, adminUserId, categoryId, payload, ipAddress) {
        const eventMap = {
            CATEGORY_CREATED: client_1.DomainEventType.CATEGORY_CREATED,
            CATEGORY_UPDATED: client_1.DomainEventType.CATEGORY_UPDATED,
            CATEGORY_DELETED: client_1.DomainEventType.CATEGORY_DELETED,
        };
        await Promise.all([
            this.audit.log({
                actorId: adminUserId,
                action,
                resourceType: 'category',
                resourceId: categoryId,
                ipAddress,
                metadata: payload,
            }),
            this.domainEvents.emit(eventMap[action], 'category', categoryId, payload, { userId: adminUserId, ipAddress: ipAddress ?? null }),
        ]);
    }
    async emitStoreGovernanceEvent(action, adminUserId, requestId, payload, ipAddress) {
        const eventMap = {
            STORE_CATEGORY_APPROVED: client_1.DomainEventType.CATEGORY_APPROVED,
            STORE_CATEGORY_REJECTED: client_1.DomainEventType.CATEGORY_REJECTED,
            STORE_CATEGORY_DOCUMENTS_REQUIRED: client_1.DomainEventType.CATEGORY_DOCUMENTS_REQUIRED,
            STORE_CATEGORY_REJECTION_REVOKED: client_1.DomainEventType.CATEGORY_REJECTION_REVOKED,
            STORE_CATEGORY_MOVED_TO_REVIEW: client_1.DomainEventType.CATEGORY_REQUESTED,
            STORE_CATEGORY_REVOKED: client_1.DomainEventType.CATEGORY_REJECTED,
        };
        await Promise.all([
            this.audit.log({
                actorId: adminUserId,
                action,
                resourceType: 'store_category_request',
                resourceId: requestId,
                ipAddress,
                metadata: payload,
            }),
            this.domainEvents.emit(eventMap[action], 'store_category_request', requestId, payload, { userId: adminUserId, ipAddress: ipAddress ?? null }),
        ]);
    }
    async invalidateBuyerCategoryCache(storeId) {
        await this.invalidateCategoryCaches(storeId);
    }
    async invalidateCategoryCaches(storeId) {
        if (storeId) {
            await this.buyerCache.invalidate(`buyer:categories:s${storeId}`);
            await this.buyerCache.deleteByPattern(`buyer:store:${storeId}:*`);
            await this.buyerCache.deleteByPattern(`merchant:categories:${storeId}:*`);
        }
        await this.buyerCache.deleteByPattern('buyer:categories:*');
        await this.buyerCache.deleteByPattern('buyer:search:*');
        await this.buyerCache.deleteByPattern('buyer:stores:*');
        await this.buyerCache.deleteByPattern('merchant:categories:*');
        await this.buyerCache.deleteByPattern('admin:category-requests:*');
        this.logger.log('Buyer/merchant category caches invalidated');
    }
    toSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .slice(0, 60);
    }
};
exports.AdminCategoryGovernanceService = AdminCategoryGovernanceService;
exports.AdminCategoryGovernanceService = AdminCategoryGovernanceService = AdminCategoryGovernanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        buyer_cache_service_1.BuyerCacheService])
], AdminCategoryGovernanceService);
//# sourceMappingURL=admin-category-governance.service.js.map