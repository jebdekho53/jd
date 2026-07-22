import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryCatalogKind,
  CategoryScope,
  DomainEventType,
  StoreCategoryRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { MerchantService } from '../merchant/merchant.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import {
  RequestStoreCategoryAccessDto,
  UploadCategoryDocumentDto,
} from './dto/category-governance.dto';
import { StoreCategoryAccessService } from './store-category-access.service';
import { ConfigService } from '@nestjs/config';
import { getConfig } from '../../config/configuration';
import { assertTrustedUploadUrl } from '../../common/utils/trusted-upload-url.util';
import { uploadPublicBases } from '../../common/utils/asset-url.util';
import { resolveStoreCatalogKind } from './utils/catalog-kind.util';
import { VerticalService } from '../store-vertical/vertical.service';

/** A node of the drill-down catalog tree returned to the merchant (any depth). */
export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  icon: string | null;
  requestStatus: StoreCategoryRequestStatus | null;
  children: CategoryTreeNode[];
};

@Injectable()
export class StoreCategoryRequestService {
  private readonly logger = new Logger(StoreCategoryRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly blocklist: VerificationBlocklistService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly categoryAccess: StoreCategoryAccessService,
    private readonly config: ConfigService,
    private readonly verticalService: VerticalService,
  ) {}

  private async assertStoreOwned(userId: string, storeId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new ForbiddenException('Store not found');
    return { profile, store };
  }

  async listCatalog(userId: string, storeId: string, catalogKind?: CategoryCatalogKind) {
    await this.assertStoreOwned(userId, storeId);
    await this.verticalService.ensureStoreBusinessTypesFromApplication(storeId);
    const kind = await resolveStoreCatalogKind(this.prisma, storeId, catalogKind);

    const [requests, approved, all] = await Promise.all([
      this.prisma.storeCategoryRequest.findMany({
        where: { storeId },
        select: { categoryId: true, subcategoryId: true, status: true },
      }),
      this.prisma.storeCategory.findMany({
        where: { storeId },
        select: { categoryId: true, subcategoryId: true },
      }),
      // Whole GLOBAL tree of this kind — the merchant drills down and picks any
      // node (L1…L4). Access is by-branch, so selecting a node grants its subtree.
      this.prisma.category.findMany({
        where: { storeId: null, scope: CategoryScope.GLOBAL, catalogKind: kind, isActive: true, deletedAt: null },
        select: { id: true, name: true, slug: true, parentId: true, sortOrder: true, icon: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    // A node counts as approved if it (or, via the request's stored pair, its
    // selected node / root) is approved; pending/rejected come from requests.
    const approvedIds = new Set<string>();
    approved.forEach((a) => { approvedIds.add(a.subcategoryId); approvedIds.add(a.categoryId); });
    const statusById = new Map<string, StoreCategoryRequestStatus>();
    requests.forEach((r) => { if (!statusById.has(r.subcategoryId)) statusById.set(r.subcategoryId, r.status); });

    const nodeMap = new Map<string, CategoryTreeNode>(
      all.map((c) => [c.id, {
        ...c,
        requestStatus: approvedIds.has(c.id) ? StoreCategoryRequestStatus.APPROVED : (statusById.get(c.id) ?? null),
        children: [],
      }]),
    );
    const roots: CategoryTreeNode[] = [];
    for (const node of nodeMap.values()) {
      const parent = node.parentId ? nodeMap.get(node.parentId) : null;
      if (parent) parent.children.push(node);
      else if (!node.parentId) roots.push(node);
    }
    return roots;
  }

  async listStoreRequests(userId: string, storeId: string) {
    await this.assertStoreOwned(userId, storeId);

    return this.prisma.storeCategoryRequest.findMany({
      where: { storeId },
      include: {
        // catalogKind lets the merchant-web Products/Menu toggle actually filter
        // this list — without it every request showed under both tabs.
        category: { select: { id: true, name: true, slug: true, catalogKind: true } },
        subcategory: { select: { id: true, name: true, slug: true, catalogKind: true } },
        store: { select: { id: true, name: true, slug: true } },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listApprovedCategories(
    userId: string,
    storeId: string,
    catalogKind?: CategoryCatalogKind,
  ) {
    await this.assertStoreOwned(userId, storeId);
    const kind = await resolveStoreCatalogKind(this.prisma, storeId, catalogKind);
    return this.categoryAccess.listApprovedCategoryTree(storeId, kind);
  }

  async requestCategoryAccess(
    userId: string,
    storeId: string,
    dto: RequestStoreCategoryAccessDto,
    ipAddress?: string,
  ) {
    const { profile } = await this.assertStoreOwned(userId, storeId);
    await this.blocklist.assertUserNotBlacklisted(userId);
    await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);

    // The merchant picks ONE node at any depth (L1…L4). Validate it and derive
    // its root ancestor — access is stored as (root, selectedNode) and, being
    // by-branch, grants the whole subtree beneath the selected node.
    //
    // We deliberately do NOT constrain to the store's resolved catalog kind: a
    // store may legitimately sell both products and menu items (e.g. a bakery
    // selling packaged grocery + fresh cakes), and the browse UI lets the
    // merchant switch catalogs. Any valid GLOBAL active category is requestable;
    // approval of a MENU category simply enables menu items, a PRODUCT category
    // enables products.
    const selectedId = dto.subcategoryId;
    const selected = await this.prisma.category.findFirst({
      where: {
        id: selectedId,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!selected) {
      throw new BadRequestException('Selected category not found or is not available');
    }
    // Walk to the root; that becomes categoryId (grouping + unique key).
    let rootId = selectedId;
    for (let i = 0; i < 10; i++) {
      const node: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: rootId },
        select: { parentId: true },
      });
      if (!node?.parentId) break;
      rootId = node.parentId;
    }
    const categoryId = rootId;
    const subcategoryId = selectedId;

    const existingApproval = await this.prisma.storeCategory.findUnique({
      where: {
        storeId_categoryId_subcategoryId: {
          storeId,
          categoryId,
          subcategoryId,
        },
      },
    });
    if (existingApproval) {
      throw new ConflictException('This store already has access to this subcategory');
    }

    const existing = await this.prisma.storeCategoryRequest.findUnique({
      where: {
        storeId_categoryId_subcategoryId: {
          storeId,
          categoryId,
          subcategoryId,
        },
      },
    });

    if (existing) {
      if (
        existing.status === StoreCategoryRequestStatus.PENDING ||
        existing.status === StoreCategoryRequestStatus.DOCUMENTS_REQUIRED ||
        existing.status === StoreCategoryRequestStatus.UNDER_REVIEW
      ) {
        throw new ConflictException('A request for this subcategory is already pending');
      }
      if (existing.status === StoreCategoryRequestStatus.APPROVED) {
        throw new ConflictException('This subcategory is already approved');
      }
      if (existing.status === StoreCategoryRequestStatus.REJECTED) {
        const updated = await this.prisma.storeCategoryRequest.update({
          where: { id: existing.id },
          data: {
            status: StoreCategoryRequestStatus.PENDING,
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
        categoryId,
        subcategoryId,
        reason: dto.reason,
        status: StoreCategoryRequestStatus.PENDING,
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

  async uploadDocument(
    userId: string,
    storeId: string,
    requestId: string,
    dto: UploadCategoryDocumentDto,
    ipAddress?: string,
  ) {
    await this.assertStoreOwned(userId, storeId);
    const request = await this.prisma.storeCategoryRequest.findFirst({
      where: { id: requestId, storeId },
    });
    if (!request) throw new NotFoundException('Category request not found');

    if (request.status !== StoreCategoryRequestStatus.DOCUMENTS_REQUIRED) {
      throw new BadRequestException(
        'Documents can only be uploaded when additional documents are requested',
      );
    }

    assertTrustedUploadUrl(dto.fileUrl, uploadPublicBases(getConfig(this.config).storage));

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

  async submitDocuments(
    userId: string,
    storeId: string,
    requestId: string,
    ipAddress?: string,
  ) {
    await this.assertStoreOwned(userId, storeId);
    const request = await this.prisma.storeCategoryRequest.findFirst({
      where: { id: requestId, storeId },
    });
    if (!request) throw new NotFoundException('Category request not found');

    if (request.status !== StoreCategoryRequestStatus.DOCUMENTS_REQUIRED) {
      throw new BadRequestException(
        'Documents can only be submitted when status is DOCUMENTS_REQUIRED',
      );
    }

    const docCount = await this.prisma.storeCategoryRequestDocument.count({
      where: { storeCategoryRequestId: requestId },
    });
    if (docCount === 0) {
      throw new BadRequestException('Upload at least one document before submitting');
    }

    const updated = await this.prisma.storeCategoryRequest.update({
      where: { id: requestId },
      data: { status: StoreCategoryRequestStatus.UNDER_REVIEW },
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

  private async emitEvent(
    userId: string,
    requestId: string,
    action: string,
    ipAddress?: string,
  ) {
    await this.audit.log({
      actorId: userId,
      action,
      resourceType: 'store_category_request',
      resourceId: requestId,
      ipAddress,
    });
    await this.domainEvents.emit(
      DomainEventType.CATEGORY_REQUESTED,
      'store_category_request',
      requestId,
      { action },
      { userId, ipAddress: ipAddress ?? null },
    );
  }
}
