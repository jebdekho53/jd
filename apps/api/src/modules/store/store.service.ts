import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DomainEventType, Prisma, Store, StoreHour, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { MerchantService } from '../merchant/merchant.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';

// Fields a merchant may edit on an APPROVED store
const APPROVED_STORE_EDITABLE_FIELDS: Array<keyof UpdateStoreDto> = [
  'description', 'phone', 'email',
  'minOrderAmount', 'deliveryFee', 'avgPrepTimeMins',
  'hours', 'zoneIds', 'serviceAreaIds',
];

type StoreWithRelations = Store & {
  hours: StoreHour[];
  storeZones: Array<{ zone: { id: string; name: string; slug: string } }>;
  storeServiceAreas: Array<{ serviceArea: { id: string; name: string; slug: string } }>;
};

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly buyerCache: BuyerCacheService,
  ) {}

  // ---------------------------------------------------------------------------
  // Create store (status: DRAFT)
  // ---------------------------------------------------------------------------

  async createStore(
    userId: string,
    dto: CreateStoreDto,
    ipAddress?: string,
  ): Promise<StoreWithRelations> {
    const profile = await this.merchantService.requireMerchantProfile(userId);

    // Validate city exists
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city) {
      throw new BadRequestException(`City not found: ${dto.cityId}`);
    }

    const slug = await this.generateUniqueSlug(profile.id, dto.name);

    const store = await this.prisma.$transaction(async (tx) => {
      const created = await tx.store.create({
        data: {
          merchantProfileId: profile.id,
          cityId: dto.cityId,
          name: dto.name,
          slug,
          description: dto.description,
          phone: dto.phone,
          email: dto.email,
          line1: dto.line1,
          line2: dto.line2,
          pincode: dto.pincode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          minOrderAmount: dto.minOrderAmount ?? 0,
          deliveryFee: dto.deliveryFee ?? 0,
          avgPrepTimeMins: dto.avgPrepTimeMins ?? 15,
          status: StoreStatus.DRAFT,
          isActive: false,
        },
      });

      // Attach zones
      if (dto.zoneIds?.length) {
        await tx.storeZone.createMany({
          data: dto.zoneIds.map((zoneId) => ({ storeId: created.id, zoneId })),
          skipDuplicates: true,
        });
      }

      // Attach service areas
      if (dto.serviceAreaIds?.length) {
        await tx.storeServiceArea.createMany({
          data: dto.serviceAreaIds.map((serviceAreaId) => ({
            storeId: created.id,
            serviceAreaId,
          })),
          skipDuplicates: true,
        });
      }

      // Upsert hours
      if (dto.hours?.length) {
        for (const h of dto.hours) {
          await tx.storeHour.upsert({
            where: { storeId_dayOfWeek: { storeId: created.id, dayOfWeek: h.dayOfWeek } },
            update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
            create: {
              storeId: created.id,
              dayOfWeek: h.dayOfWeek,
              openTime: h.openTime,
              closeTime: h.closeTime,
              isClosed: h.isClosed,
            },
          });
        }
      }

      return created;
    });

    await this.audit.log({
      actorId: userId,
      action: 'STORE_CREATED',
      resourceType: 'store',
      resourceId: store.id,
      ipAddress,
      metadata: { name: store.name, slug: store.slug } as Prisma.InputJsonValue,
    });

    this.logger.log({ userId, storeId: store.id, slug }, 'Store created');
    return this.fetchStoreWithRelations(store.id);
  }

  // ---------------------------------------------------------------------------
  // List stores for merchant
  // ---------------------------------------------------------------------------

  async listStores(
    userId: string,
    dto: ListStoresDto,
  ): Promise<{ stores: StoreWithRelations[]; total: number }> {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StoreWhereInput = {
      merchantProfileId: profile.id,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
    };

    const [stores, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
        include: {
          hours: { orderBy: { dayOfWeek: 'asc' } },
          storeZones: { include: { zone: { select: { id: true, name: true, slug: true } } } },
          storeServiceAreas: {
            include: { serviceArea: { select: { id: true, name: true, slug: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.store.count({ where }),
    ]);

    return { stores: stores as StoreWithRelations[], total };
  }

  // ---------------------------------------------------------------------------
  // Get single store (with ownership check)
  // ---------------------------------------------------------------------------

  async getStore(userId: string, storeId: string): Promise<StoreWithRelations> {
    const store = await this.fetchStoreWithRelations(storeId);
    await this.assertOwnership(userId, store);
    return store;
  }

  // ---------------------------------------------------------------------------
  // Update store
  // ---------------------------------------------------------------------------

  async updateStore(
    userId: string,
    storeId: string,
    dto: UpdateStoreDto,
    ipAddress?: string,
  ): Promise<StoreWithRelations> {
    const store = await this.fetchStoreWithRelations(storeId);
    await this.assertOwnership(userId, store);

    // For APPROVED stores: only settings-level fields allowed
    if (store.status === StoreStatus.APPROVED) {
      const disallowed = (Object.keys(dto) as Array<keyof UpdateStoreDto>).filter(
        (k) => !APPROVED_STORE_EDITABLE_FIELDS.includes(k),
      );
      if (disallowed.length > 0) {
        throw new ForbiddenException(
          `Cannot edit ${disallowed.join(', ')} on an approved store. ` +
            `Contact support if changes are required.`,
        );
      }
    }

    // PENDING_REVIEW: block all edits except withdrawal (handled by separate endpoint)
    if (store.status === StoreStatus.PENDING_REVIEW) {
      throw new ForbiddenException(
        'Store is under review. Withdraw the submission to make edits.',
      );
    }

    if (store.status === StoreStatus.SUSPENDED) {
      throw new ForbiddenException('Suspended stores cannot be edited');
    }

    // If name is being changed, regenerate slug
    let slug = store.slug;
    if (dto.name && dto.name !== store.name) {
      const profile = await this.merchantService.requireMerchantProfile(userId);
      slug = await this.generateUniqueSlug(profile.id, dto.name, storeId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: storeId },
        data: {
          ...(dto.name !== undefined && { name: dto.name, slug }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.line1 !== undefined && { line1: dto.line1 }),
          ...(dto.line2 !== undefined && { line2: dto.line2 }),
          ...(dto.pincode !== undefined && { pincode: dto.pincode }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.cityId !== undefined && { cityId: dto.cityId }),
          ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
          ...(dto.deliveryFee !== undefined && { deliveryFee: dto.deliveryFee }),
          ...(dto.avgPrepTimeMins !== undefined && { avgPrepTimeMins: dto.avgPrepTimeMins }),
        },
      });

      // Replace zones if provided
      if (dto.zoneIds !== undefined) {
        await tx.storeZone.deleteMany({ where: { storeId } });
        if (dto.zoneIds.length) {
          await tx.storeZone.createMany({
            data: dto.zoneIds.map((zoneId) => ({ storeId, zoneId })),
            skipDuplicates: true,
          });
        }
      }

      // Replace service areas if provided
      if (dto.serviceAreaIds !== undefined) {
        await tx.storeServiceArea.deleteMany({ where: { storeId } });
        if (dto.serviceAreaIds.length) {
          await tx.storeServiceArea.createMany({
            data: dto.serviceAreaIds.map((serviceAreaId) => ({ storeId, serviceAreaId })),
            skipDuplicates: true,
          });
        }
      }

      // Upsert hours if provided
      if (dto.hours?.length) {
        for (const h of dto.hours) {
          await tx.storeHour.upsert({
            where: { storeId_dayOfWeek: { storeId, dayOfWeek: h.dayOfWeek } },
            update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
            create: {
              storeId,
              dayOfWeek: h.dayOfWeek,
              openTime: h.openTime,
              closeTime: h.closeTime,
              isClosed: h.isClosed,
            },
          });
        }
      }
    });

    await this.audit.log({
      actorId: userId,
      action: 'STORE_UPDATED',
      resourceType: 'store',
      resourceId: storeId,
      ipAddress,
      metadata: { changedFields: Object.keys(dto) } as Prisma.InputJsonValue,
    });

    // Invalidate buyer caches for APPROVED stores (buyer-visible data may have changed)
    if (store.status === StoreStatus.APPROVED) {
      void this.buyerCache.invalidateStoreCache(store.slug);
    }

    return this.fetchStoreWithRelations(storeId);
  }

  // ---------------------------------------------------------------------------
  // Submit store for admin review
  // ---------------------------------------------------------------------------

  async submitForReview(
    userId: string,
    storeId: string,
    ipAddress?: string,
  ): Promise<StoreWithRelations> {
    const store = await this.fetchStoreWithRelations(storeId);
    await this.assertOwnership(userId, store);

    if (
      store.status !== StoreStatus.DRAFT &&
      store.status !== StoreStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Store cannot be submitted from status: ${store.status}. ` +
          `Only DRAFT or REJECTED stores can be submitted for review.`,
      );
    }

    // Pre-submission validation
    this.validateSubmissionReadiness(store);

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.PENDING_REVIEW,
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });

    await Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'STORE_SUBMITTED',
        resourceType: 'store',
        resourceId: storeId,
        ipAddress,
        metadata: { previousStatus: store.status } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_SUBMITTED,
        'store',
        storeId,
        { merchantUserId: userId, storeName: store.name },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log({ userId, storeId }, 'Store submitted for review');
    return this.fetchStoreWithRelations(updated.id);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  async fetchStoreWithRelations(storeId: string): Promise<StoreWithRelations> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId, deletedAt: null },
      include: {
        hours: { orderBy: { dayOfWeek: 'asc' } },
        storeZones: { include: { zone: { select: { id: true, name: true, slug: true } } } },
        storeServiceAreas: {
          include: { serviceArea: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (!store) throw new NotFoundException(`Store not found: ${storeId}`);
    return store as StoreWithRelations;
  }

  private async assertOwnership(userId: string, store: Store): Promise<void> {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    if (store.merchantProfileId !== profile.id) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  private validateSubmissionReadiness(store: StoreWithRelations): void {
    const errors: string[] = [];

    if (!store.name?.trim()) errors.push('Store name is required');
    if (!store.line1?.trim()) errors.push('Store address is required');
    if (!store.pincode?.trim()) errors.push('Pincode is required');
    if (!store.latitude || !store.longitude) errors.push('Store location (lat/lng) is required');
    if (!store.phone && !store.email) errors.push('At least one contact (phone or email) is required');
    if (!store.storeZones?.length) errors.push('At least one delivery zone must be assigned');
    if (!store.hours?.length) errors.push('Store hours must be configured');

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Store is not ready for submission',
        errors,
      });
    }
  }

  private async generateUniqueSlug(
    merchantProfileId: string,
    name: string,
    excludeStoreId?: string,
  ): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 50);

    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.store.findFirst({
        where: {
          merchantProfileId,
          slug,
          ...(excludeStoreId && { id: { not: excludeStoreId } }),
        },
      });
      if (!existing) return slug;
      slug = `${base}-${counter++}`;
    }
  }
}
