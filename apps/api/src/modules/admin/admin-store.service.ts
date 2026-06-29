import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DomainEventType, Prisma, RejectionType, StoreDocumentType, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { isBlacklistRejection, isRevocableRejection } from '../../common/constants/rejection.constants';
import { ListStoreApprovalsDto } from './dto/list-store-approvals.dto';
import { RejectStoreDto } from './dto/reject-store.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { SuspendStoreDto } from './dto/suspend-store.dto';
import { RevokeRejectionDto } from './dto/revoke-rejection.dto';
import { StoreService } from '../store/store.service';
import { MerchantService } from '../merchant/merchant.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { EmailNotificationService } from '../email/email-notification.service';

const APPROVABLE_STATUSES: StoreStatus[] = [
  StoreStatus.PENDING_REVIEW,
  StoreStatus.UNDER_REVIEW,
];

const REJECTABLE_STATUSES: StoreStatus[] = [
  StoreStatus.PENDING_REVIEW,
  StoreStatus.UNDER_REVIEW,
];

const REQUEST_DOCUMENTS_STATUSES: StoreStatus[] = [
  StoreStatus.PENDING_REVIEW,
  StoreStatus.UNDER_REVIEW,
  StoreStatus.DOCUMENTS_REQUIRED,
];

type StoreApprovalItem = {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  rejectionType: RejectionType | null;
  reviewedBy: string | null;
  documentRequestReason: string | null;
  documentRequestAt: Date | null;
  requestedDocumentTypes: unknown;
  cityId: string;
  pincode: string;
  line1: string;
  createdAt: Date;
  merchantProfile: {
    id: string;
    businessName: string;
    gstNumber: string | null;
    kycStatus: string;
    isBlacklisted: boolean;
    blacklistReason: string | null;
    user: { id: string; phone: string; email: string | null };
  };
  _count: { products: number; orders: number };
};

@Injectable()
export class AdminStoreService {
  private readonly logger = new Logger(AdminStoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly buyerCache: BuyerCacheService,
    private readonly blocklist: VerificationBlocklistService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly merchantService: MerchantService,
  ) {}

  async listStoreApprovals(
    dto: ListStoreApprovalsDto,
  ): Promise<{ stores: StoreApprovalItem[]; total: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StoreWhereInput = dto.blacklisted
      ? {
          deletedAt: null,
          merchantProfile: { isBlacklisted: true },
          ...(dto.cityId && { cityId: dto.cityId }),
        }
      : {
          status: dto.status ?? StoreStatus.PENDING_REVIEW,
          deletedAt: null,
          ...(dto.cityId && { cityId: dto.cityId }),
        };

    const fifoStatuses: StoreStatus[] = [
      StoreStatus.PENDING_REVIEW,
      StoreStatus.DOCUMENTS_REQUIRED,
      StoreStatus.UNDER_REVIEW,
    ];

    const orderBy: Prisma.StoreOrderByWithRelationInput = dto.blacklisted
      ? { createdAt: 'desc' }
      : fifoStatuses.includes(dto.status ?? StoreStatus.PENDING_REVIEW)
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

    return { stores: stores as StoreApprovalItem[], total };
  }

  async approveStore(
    adminUserId: string,
    storeId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: StoreStatus; isActive: boolean; reviewedAt: Date | null }> {
    const store = await this.findStoreOrThrow(storeId);

    if (!APPROVABLE_STATUSES.includes(store.status)) {
      throw new BadRequestException(
        `Store cannot be approved from status: ${store.status}. ` +
          `Only PENDING_REVIEW or UNDER_REVIEW stores can be approved.`,
      );
    }

    const now = new Date();

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.APPROVED,
        isActive: true,
        reviewedAt: now,
        reviewedBy: adminUserId,
        rejectionReason: null,
        documentRequestReason: null,
        documentRequestAt: null,
        documentRequestBy: null,
        requestedDocumentTypes: Prisma.JsonNull,
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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_APPROVED,
        'store',
        storeId,
        { storeName: store.name, approvedBy: adminUserId },
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);

    await this.buyerCache.invalidateStoreCache(store.slug);

    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { id: store.merchantProfileId },
      select: { userId: true },
    });
    if (merchant) {
      void this.emailNotifications.sendMerchantStoreApproved(merchant.userId, store.name);
    }

    this.logger.log(
      { adminUserId, storeId, slug: store.slug },
      'Store approved — buyer store cache invalidated',
    );
    return {
      id: updated.id,
      status: updated.status,
      isActive: updated.isActive,
      reviewedAt: updated.reviewedAt,
    };
  }

  async requestDocuments(
    adminUserId: string,
    storeId: string,
    dto: RequestDocumentsDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    id: string;
    status: StoreStatus;
    documentRequestReason: string | null;
    requestedDocumentTypes: unknown;
  }> {
    const store = await this.findStoreOrThrow(storeId);

    if (!REQUEST_DOCUMENTS_STATUSES.includes(store.status)) {
      throw new BadRequestException(
        `Documents cannot be requested from status: ${store.status}.`,
      );
    }

    const now = new Date();
    const documentTypes = dto.documentTypes as StoreDocumentType[];

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.store.update({
        where: { id: storeId },
        data: {
          status: StoreStatus.DOCUMENTS_REQUIRED,
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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_DOCUMENTS_REQUESTED,
        'store',
        storeId,
        {
          storeName: store.name,
          reason: dto.reason,
          documentTypes,
          requestedBy: adminUserId,
        },
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log({ adminUserId, storeId }, 'Store documents requested');
    return updated;
  }

  async rejectStore(
    adminUserId: string,
    storeId: string,
    dto: RejectStoreDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    id: string;
    status: StoreStatus;
    rejectionReason: string | null;
    rejectionType: RejectionType | null;
  }> {
    const store = await this.findStoreWithMerchantOrThrow(storeId);

    if (!REJECTABLE_STATUSES.includes(store.status)) {
      throw new BadRequestException(
        `Store cannot be rejected from status: ${store.status}. ` +
          `Only PENDING_REVIEW or UNDER_REVIEW stores can be rejected.`,
      );
    }

    const now = new Date();
    const isPermanent = isBlacklistRejection(dto.rejectionType);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.store.update({
        where: { id: storeId },
        data: {
          status: StoreStatus.REJECTED,
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
          requestedDocumentTypes: Prisma.JsonNull,
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
      await this.blocklist.blockMerchantIdentifiers(
        {
          phone: store.merchantProfile.user.phone,
          email: store.merchantProfile.user.email ?? store.email,
          gstNumber: store.merchantProfile.gstNumber,
          panNumber: store.merchantProfile.panNumber,
        },
        dto.reason,
        adminUserId,
        storeId,
      );

      if (store.phone && store.phone !== store.merchantProfile.user.phone) {
        await this.blocklist.blockMerchantIdentifiers(
          { phone: store.phone },
          dto.reason,
          adminUserId,
          storeId,
        );
      }

      await this.domainEvents.emit(
        DomainEventType.MERCHANT_BLACKLISTED,
        'merchant_profile',
        store.merchantProfileId,
        {
          storeId,
          storeName: store.name,
          reason: dto.reason,
          rejectionType: dto.rejectionType,
          blacklistedBy: adminUserId,
        },
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      );

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
        } as Prisma.InputJsonValue,
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
          revocable: isRevocableRejection(dto.rejectionType),
          blacklisted: isPermanent,
          storeName: store.name,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_REJECTED,
        'store',
        storeId,
        {
          storeName: store.name,
          reason: dto.reason,
          rejectionType: dto.rejectionType,
          rejectedBy: adminUserId,
          revocable: isRevocableRejection(dto.rejectionType),
          blacklisted: isPermanent,
        },
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);

    await this.buyerCache.invalidateStoreCache(store.slug);

    const rejectedMerchant = await this.prisma.merchantProfile.findUnique({
      where: { id: store.merchantProfileId },
      select: { userId: true },
    });
    if (rejectedMerchant) {
      void this.emailNotifications.sendMerchantStoreRejected(
        rejectedMerchant.userId,
        store.name,
        dto.reason,
      );
    }

    this.logger.log({ adminUserId, storeId, rejectionType: dto.rejectionType }, 'Store rejected');
    return updated;
  }

  async revokeRejection(
    adminUserId: string,
    storeId: string,
    dto: RevokeRejectionDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: StoreStatus }> {
    const store = await this.findStoreWithMerchantOrThrow(storeId);

    if (store.status !== StoreStatus.REJECTED) {
      throw new BadRequestException('Only REJECTED stores can have their rejection revoked.');
    }

    if (!isRevocableRejection(store.rejectionType)) {
      throw new BadRequestException(
        `Rejection type ${store.rejectionType ?? 'unknown'} cannot be revoked. ` +
          'Only DOCUMENT_ISSUE and COMPLIANCE_ISSUE rejections are revocable.',
      );
    }

    if (store.merchantProfile.isBlacklisted) {
      throw new BadRequestException(
        'Cannot revoke rejection for a blacklisted merchant. SUPER_ADMIN must remove the blacklist first.',
      );
    }

    const now = new Date();

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.UNDER_REVIEW,
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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_REJECTION_REVOKED,
        'store',
        storeId,
        {
          storeName: store.name,
          reason: dto.reason,
          revokedBy: adminUserId,
          previousRejectionType: store.rejectionType,
        },
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log({ adminUserId, storeId }, 'Store rejection revoked');
    return updated;
  }

  async suspendStore(
    adminUserId: string,
    storeId: string,
    dto: SuspendStoreDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: StoreStatus; isActive: boolean }> {
    const store = await this.findStoreOrThrow(storeId);

    if (store.status !== StoreStatus.APPROVED) {
      throw new BadRequestException(
        `Only APPROVED stores can be suspended. Current status: ${store.status}`,
      );
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.SUSPENDED,
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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_SUSPENDED,
        'store',
        storeId,
        { storeName: store.name, reason: dto.reason, suspendedBy: adminUserId },
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);

    await this.buyerCache.invalidateStoreCache(store.slug);

    this.logger.log({ adminUserId, storeId }, 'Store suspended');
    return updated;
  }

  async reinstateStore(
    adminUserId: string,
    storeId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: StoreStatus; isActive: boolean }> {
    const store = await this.findStoreOrThrow(storeId);

    if (store.status !== StoreStatus.SUSPENDED) {
      throw new BadRequestException(
        `Only SUSPENDED stores can be reinstated. Current status: ${store.status}`,
      );
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.APPROVED,
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
      metadata: { storeName: store.name } as Prisma.InputJsonValue,
    });

    await this.buyerCache.invalidateStoreCache(store.slug);

    this.logger.log({ adminUserId, storeId }, 'Store reinstated');
    return updated;
  }

  async deleteStore(
    adminUserId: string,
    storeId: string,
    dto: { reason: string },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; deletedAt: Date }> {
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
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_SUSPENDED,
        'store',
        storeId,
        { storeName: store.name, reason: dto.reason, deletedBy: adminUserId, deleted: true },
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);

    await this.buyerCache.invalidateStoreCache(store.slug);

    this.logger.log({ adminUserId, storeId }, 'Store soft-deleted');
    return { id: updated.id, deletedAt: updated.deletedAt! };
  }

  async getStoreDetail(storeId: string) {
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
      throw new NotFoundException(`Store not found: ${storeId}`);
    }

    return store;
  }

  private async findStoreOrThrow(storeId: string) {
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
    if (!store) throw new NotFoundException(`Store not found: ${storeId}`);
    return store;
  }

  private async findStoreWithMerchantOrThrow(storeId: string) {
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
    if (!store) throw new NotFoundException(`Store not found: ${storeId}`);
    return store;
  }
}
