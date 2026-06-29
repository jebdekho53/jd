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
import { resolveStoreCatalogKind } from './utils/catalog-kind.util';

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
    const kind = await resolveStoreCatalogKind(this.prisma, storeId, catalogKind);

    const existing = await this.prisma.storeCategoryRequest.findMany({
      where: { storeId },
      select: { categoryId: true, subcategoryId: true, status: true },
    });
    const existingMap = new Map(
      existing.map((e) => [`${e.categoryId}:${e.subcategoryId}`, e.status]),
    );

    const approved = await this.prisma.storeCategory.findMany({
      where: { storeId },
      select: { categoryId: true, subcategoryId: true },
    });
    const approvedSet = new Set(
      approved.map((a) => `${a.categoryId}:${a.subcategoryId}`),
    );

    const categories = await this.prisma.category.findMany({
      where: {
        storeId: null,
        scope: CategoryScope.GLOBAL,
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
            ? StoreCategoryRequestStatus.APPROVED
            : (existingMap.get(key) ?? null),
        };
      }),
    }));
  }

  async listStoreRequests(userId: string, storeId: string) {
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

    const expectedKind = await resolveStoreCatalogKind(this.prisma, storeId);

    const parent = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        catalogKind: expectedKind,
        isActive: true,
        deletedAt: null,
        parentId: null,
      },
    });
    if (!parent) throw new NotFoundException('Parent category not found');

    const subcategory = await this.prisma.category.findFirst({
      where: {
        id: dto.subcategoryId,
        parentId: dto.categoryId,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        catalogKind: expectedKind,
        isActive: true,
        deletedAt: null,
      },
    });
    if (!subcategory) {
      throw new BadRequestException('Subcategory not found or does not belong to the selected category');
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
      throw new ConflictException('This store already has access to this subcategory');
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
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
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

    const uploadBase = getConfig(this.config).storage.uploadPublicUrl;
    assertTrustedUploadUrl(dto.fileUrl, uploadBase);

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
