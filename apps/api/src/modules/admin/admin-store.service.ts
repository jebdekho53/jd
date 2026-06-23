import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DomainEventType, Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { ListStoreApprovalsDto } from './dto/list-store-approvals.dto';
import { RejectStoreDto } from './dto/reject-store.dto';
import { SuspendStoreDto } from './dto/suspend-store.dto';
import { StoreService } from '../store/store.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';

type StoreApprovalItem = {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  cityId: string;
  pincode: string;
  line1: string;
  createdAt: Date;
  merchantProfile: {
    id: string;
    businessName: string;
    gstNumber: string | null;
    kycStatus: string;
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
  ) {}

  // ---------------------------------------------------------------------------
  // List stores for review
  // ---------------------------------------------------------------------------

  async listStoreApprovals(
    dto: ListStoreApprovalsDto,
  ): Promise<{ stores: StoreApprovalItem[]; total: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;
    const status = dto.status ?? StoreStatus.PENDING_REVIEW;

    const where: Prisma.StoreWhereInput = {
      status,
      deletedAt: null,
      ...(dto.cityId && { cityId: dto.cityId }),
    };

    const orderBy: Prisma.StoreOrderByWithRelationInput =
      status === StoreStatus.PENDING_REVIEW
        ? { submittedAt: 'asc' }  // oldest submissions first (FIFO review)
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

  // ---------------------------------------------------------------------------
  // Approve store
  // ---------------------------------------------------------------------------

  async approveStore(
    adminUserId: string,
    storeId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: StoreStatus; isActive: boolean; reviewedAt: Date | null }> {
    const store = await this.findStoreOrThrow(storeId);

    if (store.status !== StoreStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Store cannot be approved from status: ${store.status}. ` +
          `Only PENDING_REVIEW stores can be approved.`,
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
      },
      select: { id: true, status: true, isActive: true, reviewedAt: true },
    });

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

    // Invalidate buyer discovery + detail caches (fire-and-forget)
    void this.buyerCache.invalidateStoreCache(store.slug);

    this.logger.log({ adminUserId, storeId }, 'Store approved');
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reject store
  // ---------------------------------------------------------------------------

  async rejectStore(
    adminUserId: string,
    storeId: string,
    dto: RejectStoreDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: StoreStatus; rejectionReason: string | null }> {
    const store = await this.findStoreOrThrow(storeId);

    if (store.status !== StoreStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Store cannot be rejected from status: ${store.status}.`,
      );
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.REJECTED,
        isActive: false,
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        rejectionReason: dto.reason,
      },
      select: { id: true, status: true, rejectionReason: true },
    });

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
          storeName: store.name,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_REJECTED,
        'store',
        storeId,
        { storeName: store.name, reason: dto.reason, rejectedBy: adminUserId },
        { userId: adminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);

    void this.buyerCache.invalidateStoreCache(store.slug);

    this.logger.log({ adminUserId, storeId }, 'Store rejected');
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Suspend store (APPROVED → SUSPENDED)
  // ---------------------------------------------------------------------------

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

    void this.buyerCache.invalidateStoreCache(store.slug);

    this.logger.log({ adminUserId, storeId }, 'Store suspended');
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reinstate suspended store → APPROVED
  // ---------------------------------------------------------------------------

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

    void this.buyerCache.invalidateStoreCache(store.slug);

    this.logger.log({ adminUserId, storeId }, 'Store reinstated');
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Get store approval detail (admin view — sees all stores)
  // ---------------------------------------------------------------------------

  async getStoreDetail(
    storeId: string,
  ) {
    return this.storeService.fetchStoreWithRelations(storeId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

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
}
