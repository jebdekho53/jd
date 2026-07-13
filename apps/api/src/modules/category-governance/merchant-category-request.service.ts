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
  MerchantCategoryStatus,
  Prisma,
  StoreDocumentType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { MerchantService } from '../merchant/merchant.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import {
  RequestCategoryAccessDto,
  UploadCategoryDocumentDto,
} from './dto/category-governance.dto';
import { MerchantCategoryAccessService } from './merchant-category-access.service';

@Injectable()
export class MerchantCategoryRequestService {
  private readonly logger = new Logger(MerchantCategoryRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly blocklist: VerificationBlocklistService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly categoryAccess: MerchantCategoryAccessService,
  ) {}

  async listCatalog(userId: string) {
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
        scope: CategoryScope.GLOBAL,
        isActive: true,
        deletedAt: null,
        parentId: null,
      },
      include: {
        children: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          // Third level (e.g. Health & Nutrition → Protein & Gym Supplements →
          // Whey Protein) so merchants can request a specific product type.
          include: {
            children: {
              where: { isActive: true, deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
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
        children: (ch.children ?? []).map((leaf) => ({
          ...leaf,
          requestStatus: existingMap.get(leaf.id) ?? null,
        })),
      })),
    }));
  }

  async listMyRequests(userId: string) {
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

  async requestCategoryAccess(
    userId: string,
    dto: RequestCategoryAccessDto,
    ipAddress?: string,
  ) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    await this.blocklist.assertUserNotBlacklisted(userId);
    await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);

    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        isActive: true,
        deletedAt: null,
      },
    });
    if (!category) throw new NotFoundException('Category not found');

    const existing = await this.prisma.merchantCategory.findUnique({
      where: {
        merchantProfileId_categoryId: {
          merchantProfileId: profile.id,
          categoryId: dto.categoryId,
        },
      },
    });

    if (existing) {
      if (existing.status === MerchantCategoryStatus.APPROVED) {
        throw new ConflictException('You already have access to this category');
      }
      if (
        existing.status === MerchantCategoryStatus.PENDING ||
        existing.status === MerchantCategoryStatus.DOCUMENTS_REQUIRED
      ) {
        throw new ConflictException('A request for this category is already in progress');
      }
      if (existing.status === MerchantCategoryStatus.REJECTED) {
        throw new BadRequestException(
          'This category was rejected. Contact admin to revoke the rejection before reapplying.',
        );
      }
    }

    const request = await this.prisma.merchantCategory.create({
      data: {
        merchantProfileId: profile.id,
        categoryId: dto.categoryId,
        status: MerchantCategoryStatus.PENDING,
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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.CATEGORY_REQUESTED,
        'merchant_category',
        request.id,
        {
          merchantProfileId: profile.id,
          categoryId: dto.categoryId,
          categoryName: category.name,
        },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log(
      { userId, merchantProfileId: profile.id, requestId: request.id },
      'Category access requested',
    );
    return request;
  }

  async uploadDocument(
    userId: string,
    requestId: string,
    dto: UploadCategoryDocumentDto,
    ipAddress?: string,
  ) {
    const request = await this.assertRequestOwnership(userId, requestId);

    if (request.status !== MerchantCategoryStatus.DOCUMENTS_REQUIRED) {
      throw new BadRequestException(
        'Documents can only be uploaded when additional documents are requested',
      );
    }

    const requestedTypes = this.parseDocumentTypes(request.requestedDocumentTypes);
    if (requestedTypes.length && !requestedTypes.includes(dto.documentType)) {
      throw new BadRequestException(
        `Document type ${dto.documentType} was not requested`,
      );
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

  async submitDocuments(userId: string, requestId: string, ipAddress?: string) {
    const request = await this.assertRequestOwnership(userId, requestId);

    if (request.status !== MerchantCategoryStatus.DOCUMENTS_REQUIRED) {
      throw new BadRequestException(
        'Documents can only be submitted when status is DOCUMENTS_REQUIRED',
      );
    }

    const requestedTypes = this.parseDocumentTypes(request.requestedDocumentTypes);
    const docs = await this.prisma.merchantCategoryDocument.findMany({
      where: { merchantCategoryId: requestId },
    });
    const uploaded = new Set(docs.map((d) => d.documentType));
    const missing = requestedTypes.filter((t) => !uploaded.has(t));

    if (missing.length) {
      throw new BadRequestException({
        message: 'Please upload all requested documents before submitting',
        missingDocuments: missing,
      });
    }

    return this.prisma.merchantCategory.update({
      where: { id: requestId },
      data: { status: MerchantCategoryStatus.PENDING, submittedAt: new Date() },
      include: {
        category: true,
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });
  }

  async listApprovedCategories(userId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    return this.categoryAccess.listApprovedCategoryTree(profile.id);
  }

  private async getRequestForMerchant(userId: string, requestId: string) {
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

  private async assertRequestOwnership(userId: string, requestId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const request = await this.prisma.merchantCategory.findFirst({
      where: { id: requestId, merchantProfileId: profile.id },
    });
    if (!request) throw new NotFoundException('Category request not found');
    return request;
  }

  private parseDocumentTypes(value: unknown): StoreDocumentType[] {
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is StoreDocumentType =>
      Object.values(StoreDocumentType).includes(v as StoreDocumentType),
    );
  }
}
