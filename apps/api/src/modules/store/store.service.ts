import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DomainEventType, DayOfWeek, Prisma, Store, StoreDocumentType, StoreHour, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { MerchantService } from '../merchant/merchant.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { LocationDirectoryService } from '../location-directory/location-directory.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';
import { UploadVerificationDocumentDto } from './dto/upload-verification-document.dto';
import { CartService } from '../cart/cart.service';
import { ConfigService } from '@nestjs/config';
import { getConfig } from '../../config/configuration';
import { assertTrustedUploadUrl } from '../../common/utils/trusted-upload-url.util';
import { uploadPublicBases } from '../../common/utils/asset-url.util';

// Fields a merchant may edit on an APPROVED store
const APPROVED_STORE_EDITABLE_FIELDS: Array<keyof UpdateStoreDto> = [
  'description', 'phone', 'email',
  'logoUrl', 'bannerUrl',
  'minOrderAmount', 'deliveryFee', 'avgPrepTimeMins', 'deliveryRadiusKm',
  'deliveryMode', 'freeDeliveryThreshold',
  'hours', 'zoneIds', 'serviceAreaIds',
];

type StoreWithRelations = Store & {
  hours: StoreHour[];
  storeZones: Array<{ zone: { id: string; name: string; slug: string } }>;
  storeServiceAreas: Array<{ serviceArea: { id: string; name: string; slug: string } }>;
  verificationDocuments: Array<{
    id: string;
    documentType: StoreDocumentType;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    uploadedAt: Date;
  }>;
  documentRequests: Array<{
    id: string;
    reason: string;
    documentTypes: unknown;
    requestedAt: Date;
    fulfilledAt: Date | null;
  }>;
  merchantProfile?: {
    id: string;
    isBlacklisted: boolean;
    blacklistReason: string | null;
    businessName: string;
  };
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
    private readonly blocklist: VerificationBlocklistService,
    private readonly locations: LocationDirectoryService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
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

    await this.blocklist.assertUserNotBlacklisted(userId);
    await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);
    await this.assertMerchantNotBlocked(userId, {
      phone: dto.phone,
      email: dto.email,
      gstNumber: profile.gstNumber,
      panNumber: profile.panNumber,
    });

    // Validate city exists
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city) {
      throw new BadRequestException(`City not found: ${dto.cityId}`);
    }

    const mld = await this.locations.tryResolvePincode({
      pincode: dto.pincode,
      locationCityId: dto.locationCityId,
      locationAreaId: dto.locationAreaId,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    const locationPincodeId = mld.inMasterDirectory
      ? dto.locationPincodeId ?? mld.locationPincodeId
      : dto.locationPincodeId;
    const locationAreaId = mld.inMasterDirectory
      ? dto.locationAreaId ?? mld.locationAreaId
      : dto.locationAreaId;
    const locationCityId = mld.inMasterDirectory
      ? dto.locationCityId ?? mld.locationCityId
      : dto.locationCityId;
    const latitude = dto.latitude ?? (mld.inMasterDirectory ? mld.latitude : undefined);
    const longitude = dto.longitude ?? (mld.inMasterDirectory ? mld.longitude : undefined);

    if (latitude == null || longitude == null) {
      throw new BadRequestException('Store latitude and longitude are required');
    }

    const citySlug = await this.citySlugForStore(dto.cityId);
    const slug = await this.generateUniqueSlug(dto.name, citySlug);

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
          latitude,
          longitude,
          locationPincodeId: locationPincodeId ?? null,
          locationAreaId: locationAreaId ?? null,
          locationCityId: locationCityId ?? null,
          logoUrl: dto.logoUrl,
          bannerUrl: dto.bannerUrl,
          minOrderAmount: dto.minOrderAmount ?? 0,
          deliveryFee: dto.deliveryFee ?? 0,
          avgPrepTimeMins: dto.avgPrepTimeMins ?? 15,
          status: StoreStatus.DRAFT,
          isActive: false,
        },
      });

      // Attach zones — use all city zones when none specified
      let zoneIds = dto.zoneIds;
      if (!zoneIds?.length) {
        const cityZones = await tx.zone.findMany({
          where: { cityId: dto.cityId, isActive: true },
          select: { id: true },
        });
        zoneIds = cityZones.map((z) => z.id);
      }
      if (zoneIds.length) {
        await tx.storeZone.createMany({
          data: zoneIds.map((zoneId) => ({ storeId: created.id, zoneId })),
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

      // Default operating hours 9 AM – 10 PM when not provided
      const hours = dto.hours?.length
        ? dto.hours
        : Object.values(DayOfWeek).map((dayOfWeek) => ({
            dayOfWeek,
            openTime: '09:00',
            closeTime: '22:00',
            isClosed: false,
          }));

      for (const h of hours) {
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

      const coveragePincodes = [
        ...new Set([dto.pincode, ...(dto.deliveryCoveragePincodes ?? [])].filter((p) => /^\d{6}$/.test(p))),
      ];
      for (const pc of coveragePincodes) {
        try {
          const loc = await this.locations.validatePincode({ pincode: pc });
          await tx.storeDeliveryArea.create({
            data: {
              storeId: created.id,
              pincode: pc,
              city: loc.city,
              state: loc.state,
              locationPincodeId: loc.id,
              deliveryFee: dto.deliveryFee,
              minimumOrder: dto.minOrderAmount,
              estimatedMinutes: dto.avgPrepTimeMins,
            },
          });
        } catch {
          // skip non-master pincodes during create
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

    if (store.status === StoreStatus.UNDER_REVIEW) {
      throw new ForbiddenException('Store is under admin review. Edits are locked.');
    }

    if (store.status === StoreStatus.DOCUMENTS_REQUIRED) {
      throw new ForbiddenException(
        'Upload requested documents to continue verification. Store details cannot be edited.',
      );
    }

    if (store.status === StoreStatus.REJECTED) {
      throw new ForbiddenException(
        'This store was rejected and cannot be edited until an admin revokes the rejection.',
      );
    }

    if (store.status === StoreStatus.SUSPENDED) {
      throw new ForbiddenException('Suspended stores cannot be edited');
    }

    // If name is being changed, regenerate a globally-unique, city-scoped slug.
    // NOTE: renaming changes the public URL (existing behaviour). The legacy
    // /stores/[slug] → /store/[slug] redirect is unaffected; a per-store
    // old-slug redirect history is a possible future enhancement.
    let slug = store.slug;
    if (dto.name && dto.name !== store.name) {
      const targetCityId = dto.cityId ?? store.cityId;
      const citySlug = targetCityId ? await this.citySlugForStore(targetCityId) : null;
      slug = await this.generateUniqueSlug(dto.name, citySlug, storeId);
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
          ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
          ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
          ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
          ...(dto.deliveryFee !== undefined && { deliveryFee: dto.deliveryFee }),
          ...(dto.avgPrepTimeMins !== undefined && { avgPrepTimeMins: dto.avgPrepTimeMins }),
          ...(dto.deliveryRadiusKm !== undefined && { deliveryRadiusKm: dto.deliveryRadiusKm }),
          ...(dto.deliveryMode !== undefined && { deliveryMode: dto.deliveryMode }),
          ...(dto.freeDeliveryThreshold !== undefined && {
            freeDeliveryThreshold: dto.freeDeliveryThreshold,
          }),
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

    // Delivery-mode / free-delivery-threshold changes affect the cart delivery
    // fee, so refresh any cached carts for this store immediately.
    if (dto.deliveryMode !== undefined || dto.freeDeliveryThreshold !== undefined) {
      void this.cartService.invalidateStoreCarts(storeId);
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

    if (store.status !== StoreStatus.DRAFT) {
      throw new BadRequestException(
        `Store cannot be submitted from status: ${store.status}. ` +
          `Only DRAFT stores can be submitted for review.`,
      );
    }

    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id: store.merchantProfileId },
      include: { user: { select: { phone: true, email: true } } },
    });

    await this.blocklist.assertUserNotBlacklisted(userId);
    if (profile) {
      await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);
    }

    await this.assertMerchantNotBlocked(userId, {
      phone: store.phone ?? profile?.user.phone,
      email: store.email ?? profile?.user.email,
      gstNumber: profile?.gstNumber,
      panNumber: profile?.panNumber,
    });

    // Pre-submission validation
    this.validateSubmissionReadiness(store, profile);

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
  // Upload verification document (DOCUMENTS_REQUIRED only)
  // ---------------------------------------------------------------------------

  async uploadVerificationDocument(
    userId: string,
    storeId: string,
    dto: UploadVerificationDocumentDto,
    ipAddress?: string,
  ): Promise<StoreWithRelations> {
    const store = await this.fetchStoreWithRelations(storeId);
    await this.assertOwnership(userId, store);

    if (store.status !== StoreStatus.DOCUMENTS_REQUIRED) {
      throw new BadRequestException(
        'Documents can only be uploaded when additional documents are requested.',
      );
    }

    const requestedTypes = this.parseDocumentTypes(store.requestedDocumentTypes);
    if (requestedTypes.length && !requestedTypes.includes(dto.documentType)) {
      throw new BadRequestException(
        `Document type ${dto.documentType} was not requested. ` +
          `Requested: ${requestedTypes.join(', ')}`,
      );
    }

    assertTrustedUploadUrl(dto.fileUrl, uploadPublicBases(getConfig(this.config).storage));

    await this.prisma.storeVerificationDocument.create({
      data: {
        storeId,
        documentType: dto.documentType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        uploadedBy: userId,
      },
    });

    await this.audit.log({
      actorId: userId,
      action: 'STORE_DOCUMENT_UPLOADED',
      resourceType: 'store',
      resourceId: storeId,
      ipAddress,
      metadata: {
        documentType: dto.documentType,
        fileName: dto.fileName,
      } as Prisma.InputJsonValue,
    });

    return this.fetchStoreWithRelations(storeId);
  }

  // ---------------------------------------------------------------------------
  // Submit uploaded documents for admin review (DOCUMENTS_REQUIRED → UNDER_REVIEW)
  // ---------------------------------------------------------------------------

  async submitDocumentsForReview(
    userId: string,
    storeId: string,
    ipAddress?: string,
  ): Promise<StoreWithRelations> {
    const store = await this.fetchStoreWithRelations(storeId);
    await this.assertOwnership(userId, store);

    if (store.status !== StoreStatus.DOCUMENTS_REQUIRED) {
      throw new BadRequestException(
        'Documents can only be submitted when status is DOCUMENTS_REQUIRED.',
      );
    }

    const requestedTypes = this.parseDocumentTypes(store.requestedDocumentTypes);
    if (!requestedTypes.length) {
      throw new BadRequestException('No document types were requested for this store.');
    }

    const uploadedTypes = new Set(
      store.verificationDocuments.map((d) => d.documentType),
    );
    const missing = requestedTypes.filter((t) => !uploadedTypes.has(t));
    if (missing.length) {
      throw new BadRequestException({
        message: 'Please upload all requested documents before submitting.',
        missingDocuments: missing,
      });
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: storeId },
        data: { status: StoreStatus.UNDER_REVIEW },
      });

      await tx.storeDocumentRequest.updateMany({
        where: { storeId, fulfilledAt: null },
        data: { fulfilledAt: now },
      });
    });

    await Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'STORE_DOCUMENTS_SUBMITTED',
        resourceType: 'store',
        resourceId: storeId,
        ipAddress,
        metadata: { documentTypes: requestedTypes } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.STORE_DOCUMENTS_SUBMITTED,
        'store',
        storeId,
        { merchantUserId: userId, storeName: store.name, documentTypes: requestedTypes },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log({ userId, storeId }, 'Store documents submitted for review');
    return this.fetchStoreWithRelations(storeId);
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
            isBlacklisted: true,
            blacklistReason: true,
          },
        },
      },
    });

    if (!store) throw new NotFoundException(`Store not found: ${storeId}`);
    return store as StoreWithRelations;
  }

  private parseDocumentTypes(value: unknown): StoreDocumentType[] {
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is StoreDocumentType =>
      typeof v === 'string' && Object.values(StoreDocumentType).includes(v as StoreDocumentType),
    );
  }

  private async assertMerchantNotBlocked(
    userId: string,
    input: {
      phone?: string | null;
      email?: string | null;
      gstNumber?: string | null;
      panNumber?: string | null;
    },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, email: true },
    });

    await this.blocklist.assertNotBlocked({
      phone: input.phone ?? user?.phone,
      email: input.email ?? user?.email,
      gstNumber: input.gstNumber,
      panNumber: input.panNumber,
    });
  }

  private async assertOwnership(userId: string, store: Store): Promise<void> {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    if (store.merchantProfileId !== profile.id) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  private validateSubmissionReadiness(
    store: StoreWithRelations,
    profile: { businessName: string; gstNumber: string | null; panNumber: string | null } | null,
  ): void {
    const errors: string[] = [];

    if (!store.name?.trim()) errors.push('Store name is required');
    if (!store.line1?.trim()) errors.push('Store address is required');
    if (!store.pincode?.trim()) errors.push('Pincode is required');
    if (!store.latitude || !store.longitude) errors.push('Store location (lat/lng) is required');
    if (!store.phone?.trim()) errors.push('Store phone is required');
    if (!store.email?.trim()) errors.push('Store email is required for billing');
    if (!store.storeZones?.length) errors.push('At least one delivery zone must be assigned');
    if (!store.hours?.length) errors.push('Store hours must be configured');
    if (!store.logoUrl?.trim()) errors.push('Store logo (1:1) is required');
    if (!store.bannerUrl?.trim()) errors.push('Store banner image is required');

    if (!profile?.businessName?.trim()) errors.push('Business name is required on merchant profile');
    // GSTIN is deliberately NOT required. A seller under the s.22 threshold making
    // only intra-state supplies may sell through an e-commerce operator without
    // registering (Notification 34/2023), and this platform is hyperlocal — a store
    // only delivers inside its own radius. PAN stays mandatory: it is required for
    // that exemption route and for TDS/TCS reporting either way.
    if (!profile?.panNumber?.trim()) errors.push('PAN is required for billing and tax compliance');

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Store is not ready for submission',
        errors,
      });
    }
  }

  /** Slugify a free-text value into a URL-safe token. */
  private slugifyToken(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50)
      .replace(/-+$/g, '');
  }

  private async isSlugAvailable(slug: string, excludeStoreId?: string): Promise<boolean> {
    // Global check (includes soft-deleted rows) so generation never collides
    // with the global unique index on stores.slug.
    const existing = await this.prisma.store.findFirst({
      where: { slug, ...(excludeStoreId ? { id: { not: excludeStoreId } } : {}) },
      select: { id: true },
    });
    return !existing;
  }

  /**
   * Generate a GLOBALLY-unique, SEO-friendly store slug in the form
   * `store-name-city`, falling back to `store-name-city-<shortid>` on collision.
   * Store URLs are global (/store/[slug]), so uniqueness must be global — not
   * per-merchant. `citySlug` is optional; when absent the bare name is used.
   */
  private async generateUniqueSlug(
    name: string,
    citySlug: string | null,
    excludeStoreId?: string,
  ): Promise<string> {
    const base = this.slugifyToken(name);
    const city = citySlug ? this.slugifyToken(citySlug) : '';
    const preferred = city ? `${base}-${city}`.slice(0, 60).replace(/-+$/g, '') : base;

    if (await this.isSlugAvailable(preferred, excludeStoreId)) return preferred;

    for (let attempt = 0; attempt < 5; attempt++) {
      const shortId = randomUUID().replace(/-/g, '').slice(0, 6);
      const candidate = `${preferred}-${shortId}`;
      if (await this.isSlugAvailable(candidate, excludeStoreId)) return candidate;
    }
    // Effectively-unreachable final fallback — a timestamp token is unique.
    return `${preferred}-${Date.now().toString(36)}`;
  }

  /** Resolve a city's slug for slug generation. Returns null if not found. */
  private async citySlugForStore(cityId: string): Promise<string | null> {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: { slug: true },
    });
    return city?.slug ?? null;
  }
}
