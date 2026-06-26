import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryScope,
  DomainEventType,
  Prisma,
  StoreCategoryRequestStatus,
  StoreDocumentType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import {
  CreateGlobalCategoryDto,
  ListCategoryRequestsDto,
  RejectCategoryRequestDto,
  RequestCategoryDocumentsDto,
  RevokeCategoryRejectionDto,
  UpdateGlobalCategoryDto,
} from './dto/category-governance.dto';

@Injectable()
export class AdminCategoryGovernanceService {
  private readonly logger = new Logger(AdminCategoryGovernanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly buyerCache: BuyerCacheService,
  ) {}

  // ── Global category catalog ───────────────────────────────────────────────

  async listGlobalCategories() {
    return this.prisma.category.findMany({
      where: { storeId: null, scope: CategoryScope.GLOBAL, deletedAt: null, parentId: null },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getGlobalCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        deletedAt: null,
      },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!category) throw new NotFoundException('Global category not found');
    return category;
  }

  async createGlobalCategory(dto: CreateGlobalCategoryDto, adminUserId: string) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: dto.parentId,
          storeId: null,
          scope: CategoryScope.GLOBAL,
          deletedAt: null,
        },
      });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const slug = this.toSlug(dto.name);
    const existing = await this.prisma.category.findFirst({
      where: {
        storeId: null,
        slug,
        parentId: dto.parentId ?? null,
        deletedAt: null,
      },
    });
    if (existing) throw new ConflictException(`Category slug "${slug}" already exists`);

    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
        icon: dto.icon,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        scope: CategoryScope.GLOBAL,
        isActive: true,
      },
      include: { children: { where: { deletedAt: null } } },
    });

    await this.emitCatalogEvent(
      'CATEGORY_CREATED',
      adminUserId,
      created.id,
      {
        name: created.name,
        parentId: created.parentId,
        isSubcategory: Boolean(created.parentId),
      },
    );
    await this.invalidateBuyerCategoryCache();
    return created;
  }

  async updateGlobalCategory(
    categoryId: string,
    dto: UpdateGlobalCategoryDto,
    adminUserId: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        deletedAt: null,
      },
    });
    if (!category) throw new NotFoundException('Global category not found');

    const nextImageUrl = dto.imageUrl !== undefined ? dto.imageUrl : category.imageUrl;
    const nextIsActive = dto.isActive !== undefined ? dto.isActive : category.isActive;
    if (nextIsActive && !nextImageUrl) {
      throw new BadRequestException('Category image is required for active categories');
    }
    if (dto.imageUrl === null || dto.imageUrl === '') {
      throw new BadRequestException('Category image cannot be removed');
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
      if (conflict) throw new ConflictException(`Category slug "${slug}" already exists`);
    }

    const slug =
      dto.name && dto.name !== category.name ? this.toSlug(dto.name) : undefined;

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

  async softDeleteGlobalCategory(categoryId: string, adminUserId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        deletedAt: null,
      },
      include: { children: { where: { deletedAt: null }, select: { id: true } } },
    });
    if (!category) throw new NotFoundException('Global category not found');

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

  // ── Store category request queue ──────────────────────────────────────────

  async listCategoryRequests(dto: ListCategoryRequestsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StoreCategoryRequestWhereInput = {
      ...(dto.status && { status: dto.status }),
      ...(dto.storeId && { storeId: dto.storeId }),
    };

    const [requests, total] = await this.prisma.$transaction([
      this.prisma.storeCategoryRequest.findMany({
        where,
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

  async getCategoryRequest(requestId: string) {
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
    if (!request) throw new NotFoundException('Category request not found');
    return request;
  }

  async approveCategoryRequest(
    requestId: string,
    adminUserId: string,
    ipAddress?: string,
  ) {
    const request = await this.findStoreRequestOrThrow(requestId);

    const approvable: StoreCategoryRequestStatus[] = [
      StoreCategoryRequestStatus.PENDING,
      StoreCategoryRequestStatus.DOCUMENTS_REQUIRED,
      StoreCategoryRequestStatus.UNDER_REVIEW,
    ];
    if (!approvable.includes(request.status)) {
      throw new BadRequestException(
        `Cannot approve request in status: ${request.status}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.storeCategoryRequest.update({
        where: { id: requestId },
        data: {
          status: StoreCategoryRequestStatus.APPROVED,
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

  async rejectCategoryRequest(
    requestId: string,
    adminUserId: string,
    dto: RejectCategoryRequestDto,
    ipAddress?: string,
  ) {
    const request = await this.findStoreRequestOrThrow(requestId);

    const rejectable: StoreCategoryRequestStatus[] = [
      StoreCategoryRequestStatus.PENDING,
      StoreCategoryRequestStatus.UNDER_REVIEW,
    ];
    if (!rejectable.includes(request.status)) {
      throw new BadRequestException(
        `Cannot reject request in status: ${request.status}. Document requests must be reviewed, not rejected.`,
      );
    }

    const updated = await this.prisma.storeCategoryRequest.update({
      where: { id: requestId },
      data: {
        status: StoreCategoryRequestStatus.REJECTED,
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

  async requestCategoryDocuments(
    requestId: string,
    adminUserId: string,
    dto: RequestCategoryDocumentsDto,
    ipAddress?: string,
  ) {
    const request = await this.findStoreRequestOrThrow(requestId);

    if (
      request.status !== StoreCategoryRequestStatus.PENDING &&
      request.status !== StoreCategoryRequestStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot request documents for status: ${request.status}`,
      );
    }

    const updated = await this.prisma.storeCategoryRequest.update({
      where: { id: requestId },
      data: {
        status: StoreCategoryRequestStatus.DOCUMENTS_REQUIRED,
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

  async moveCategoryRequestToReview(
    requestId: string,
    adminUserId: string,
    ipAddress?: string,
  ) {
    const request = await this.findStoreRequestOrThrow(requestId);

    if (request.status !== StoreCategoryRequestStatus.PENDING) {
      throw new BadRequestException(
        `Only pending requests can be moved to review (current: ${request.status})`,
      );
    }

    const updated = await this.prisma.storeCategoryRequest.update({
      where: { id: requestId },
      data: {
        status: StoreCategoryRequestStatus.UNDER_REVIEW,
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

  async revokeCategoryApproval(
    requestId: string,
    adminUserId: string,
    dto: RejectCategoryRequestDto,
    ipAddress?: string,
  ) {
    const request = await this.findStoreRequestOrThrow(requestId);

    if (request.status !== StoreCategoryRequestStatus.APPROVED) {
      throw new BadRequestException('Only approved category grants can be revoked');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.storeCategoryRequest.update({
        where: { id: requestId },
        data: {
          status: StoreCategoryRequestStatus.REVOKED,
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

  async bulkCategoryRequestAction(
    requestIds: string[],
    action: 'approve' | 'reject' | 'request-documents' | 'move-to-review',
    adminUserId: string,
    payload: { reason?: string; documentTypes?: StoreDocumentType[] },
    ipAddress?: string,
  ) {
    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const id of requestIds) {
      try {
        if (action === 'approve') {
          await this.approveCategoryRequest(id, adminUserId, ipAddress);
        } else if (action === 'reject') {
          await this.rejectCategoryRequest(id, adminUserId, { reason: payload.reason ?? 'Rejected' }, ipAddress);
        } else if (action === 'request-documents') {
          await this.requestCategoryDocuments(id, adminUserId, {
            reason: payload.reason ?? 'Documents required',
            documentTypes: payload.documentTypes,
          }, ipAddress);
        } else {
          await this.moveCategoryRequestToReview(id, adminUserId, ipAddress);
        }
        results.push({ id, ok: true });
      } catch (err) {
        results.push({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return { results, succeeded: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
  }

  async revokeCategoryRejection(
    requestId: string,
    adminUserId: string,
    dto: RevokeCategoryRejectionDto,
    ipAddress?: string,
  ) {
    const request = await this.findStoreRequestOrThrow(requestId);

    if (request.status !== StoreCategoryRequestStatus.REJECTED) {
      throw new BadRequestException('Only rejected requests can be reopened');
    }

    const updated = await this.prisma.storeCategoryRequest.update({
      where: { id: requestId },
      data: {
        status: StoreCategoryRequestStatus.PENDING,
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
    const [
      parentCount,
      subCount,
      requestsByStatus,
      topByProducts,
      storesPerCategory,
    ] = await Promise.all([
      this.prisma.category.count({
        where: { scope: CategoryScope.GLOBAL, deletedAt: null, parentId: null },
      }),
      this.prisma.category.count({
        where: { scope: CategoryScope.GLOBAL, deletedAt: null, parentId: { not: null } },
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
      ...topByProducts.map((u) => u.categoryId!),
      ...storesPerCategory.map((s) => s.categoryId),
    ];
    const categoryNames = await this.prisma.category.findMany({
      where: { id: { in: [...new Set(categoryIds)] } },
      select: { id: true, name: true, parentId: true },
    });

    const requestMap = Object.fromEntries(
      requestsByStatus.map((r) => [r.status, r._count.id]),
    );

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

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findStoreRequestOrThrow(requestId: string) {
    const request = await this.prisma.storeCategoryRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Category request not found');
    return request;
  }

  private async emitCatalogEvent(
    action: 'CATEGORY_CREATED' | 'CATEGORY_UPDATED' | 'CATEGORY_DELETED',
    adminUserId: string,
    categoryId: string,
    payload: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const eventMap = {
      CATEGORY_CREATED: DomainEventType.CATEGORY_CREATED,
      CATEGORY_UPDATED: DomainEventType.CATEGORY_UPDATED,
      CATEGORY_DELETED: DomainEventType.CATEGORY_DELETED,
    } as const;

    await Promise.all([
      this.audit.log({
        actorId: adminUserId,
        action,
        resourceType: 'category',
        resourceId: categoryId,
        ipAddress,
        metadata: payload as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        eventMap[action],
        'category',
        categoryId,
        payload as Prisma.InputJsonValue,
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);
  }

  private async emitStoreGovernanceEvent(
    action:
      | 'STORE_CATEGORY_APPROVED'
      | 'STORE_CATEGORY_REJECTED'
      | 'STORE_CATEGORY_DOCUMENTS_REQUIRED'
      | 'STORE_CATEGORY_REJECTION_REVOKED'
      | 'STORE_CATEGORY_MOVED_TO_REVIEW'
      | 'STORE_CATEGORY_REVOKED',
    adminUserId: string,
    requestId: string,
    payload: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const eventMap = {
      STORE_CATEGORY_APPROVED: DomainEventType.CATEGORY_APPROVED,
      STORE_CATEGORY_REJECTED: DomainEventType.CATEGORY_REJECTED,
      STORE_CATEGORY_DOCUMENTS_REQUIRED: DomainEventType.CATEGORY_DOCUMENTS_REQUIRED,
      STORE_CATEGORY_REJECTION_REVOKED: DomainEventType.CATEGORY_REJECTION_REVOKED,
      STORE_CATEGORY_MOVED_TO_REVIEW: DomainEventType.CATEGORY_REQUESTED,
      STORE_CATEGORY_REVOKED: DomainEventType.CATEGORY_REJECTED,
    } as const;

    await Promise.all([
      this.audit.log({
        actorId: adminUserId,
        action,
        resourceType: 'store_category_request',
        resourceId: requestId,
        ipAddress,
        metadata: payload as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        eventMap[action],
        'store_category_request',
        requestId,
        payload as Prisma.InputJsonValue,
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);
  }

  private async invalidateBuyerCategoryCache(storeId?: string) {
    await this.invalidateCategoryCaches(storeId);
  }

  private async invalidateCategoryCaches(storeId?: string) {
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

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 60);
  }
}
