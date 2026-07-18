import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KycStatus, MerchantProfile, Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VerificationBlocklistService } from './verification-blocklist.service';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';
import { MarketingCardService } from '../marketing/marketing-card.service';
import { getConfig } from '../../config/configuration';
import { readUploadFileFromUrl } from '../../common/utils/upload-file.util';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly blocklist: VerificationBlocklistService,
    private readonly config: ConfigService,
    private readonly card: MarketingCardService,
  ) {}

  /** The store's shareable card (PNG): store logo, contacts, and a QR to shop. */
  async getMarketingCardPng(userId: string): Promise<Buffer> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Merchant profile required');

    const store = await this.prisma.store.findFirst({
      where: { merchantProfileId: profile.id },
      orderBy: { createdAt: 'asc' },
      select: {
        name: true,
        slug: true,
        logoUrl: true,
        phone: true,
        email: true,
        line1: true,
        line2: true,
        locality: true,
        pincode: true,
        city: { select: { name: true } },
      },
    });
    if (!store) throw new NotFoundException('No store to build a card for yet');

    // The card shows the OWNER's photo (uploaded in onboarding), falling back to the
    // store logo for merchants who never set one.
    const application = await this.prisma.merchantApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { ownerPhotoUrl: true },
    });

    const cfg = getConfig(this.config);
    const base = cfg.buyerSiteUrl.replace(/\/$/, '');
    const photo = await readUploadFileFromUrl(
      cfg.storage.uploadDir,
      cfg.storage,
      application?.ownerPhotoUrl ?? store.logoUrl,
    );
    const address = [store.line1, store.line2, store.locality, store.city?.name, store.pincode]
      .filter(Boolean)
      .join(', ');

    return this.card.render({
      name: store.name,
      roleTitle: 'JebDekho Store',
      pillLabel: store.city?.name ? `Now on JebDekho · ${store.city.name}` : 'Now on JebDekho',
      phone: store.phone,
      whatsapp: store.phone,
      email: store.email,
      address: address || store.city?.name || null,
      qrUrl: `${base}/store/${store.slug}`,
      qrCaption: 'Scan to Shop',
      photo,
    });
  }

  // ---------------------------------------------------------------------------
  // Create merchant profile
  // ---------------------------------------------------------------------------

  async createProfile(
    userId: string,
    dto: CreateMerchantProfileDto,
    ipAddress?: string,
  ): Promise<MerchantProfile> {
    const existing = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Merchant profile already exists for this account');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true, email: true },
    });

    await this.blocklist.assertNotBlocked({
      phone: user.phone,
      email: user.email,
      gstNumber: dto.gstNumber,
      panNumber: dto.panNumber,
    });
    await this.blocklist.assertUserNotBlacklisted(userId);

    const profile = await this.prisma.$transaction(async (tx) => {
      const created = await tx.merchantProfile.create({
        data: {
          userId,
          businessName: dto.businessName,
          gstNumber: dto.gstNumber,
          panNumber: dto.panNumber,
          gstExemptDeclaredAt: dto.gstExempt ? new Date() : null,
          kycStatus: KycStatus.PENDING,
        },
      });

      // MERCHANT role is granted only after admin approval (ensureMerchantRole).
      return created;
    });

    await this.audit.log({
      actorId: userId,
      action: 'MERCHANT_PROFILE_CREATED',
      resourceType: 'merchant_profile',
      resourceId: profile.id,
      ipAddress,
      metadata: { businessName: dto.businessName } as Prisma.InputJsonValue,
    });

    this.logger.log({ userId, profileId: profile.id }, 'Merchant profile created');
    return profile;
  }

  /** Idempotent — safe to call after onboarding submit or admin approval. */
  async ensureMerchantRole(userId: string): Promise<void> {
    const merchantRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: RoleName.MERCHANT },
    });
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: merchantRole.id } },
      update: {},
      create: { userId, roleId: merchantRole.id },
    });
  }

  // ---------------------------------------------------------------------------
  // Get merchant profile (own)
  // ---------------------------------------------------------------------------

  async getProfile(userId: string): Promise<MerchantProfile> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: {
        _count: { select: { stores: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException(
        'Merchant profile not found. Create one with POST /merchant/profile',
      );
    }

    return profile;
  }

  // ---------------------------------------------------------------------------
  // Update merchant profile
  // ---------------------------------------------------------------------------

  async updateProfile(
    userId: string,
    dto: UpdateMerchantProfileDto,
    ipAddress?: string,
  ): Promise<MerchantProfile> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: { user: { select: { phone: true, email: true } } },
    });
    if (!profile) {
      throw new NotFoundException('Merchant profile not found');
    }

    await this.blocklist.assertNotBlocked({
      phone: profile.user.phone,
      email: profile.user.email,
      gstNumber: dto.gstNumber ?? profile.gstNumber,
      panNumber: dto.panNumber ?? profile.panNumber,
    });
    await this.blocklist.assertMerchantProfileNotBlacklisted(profile.id);

    const updated = await this.prisma.merchantProfile.update({
      where: { userId },
      data: {
        ...(dto.businessName !== undefined && { businessName: dto.businessName }),
        ...(dto.gstNumber !== undefined && { gstNumber: dto.gstNumber }),
        ...(dto.panNumber !== undefined && { panNumber: dto.panNumber }),
        // The two answers are mutually exclusive: supplying a GSTIN withdraws the
        // exemption declaration, and declaring exemption clears the GSTIN.
        ...(dto.gstExempt === true && { gstExemptDeclaredAt: new Date(), gstNumber: null }),
        ...(dto.gstNumber ? { gstExemptDeclaredAt: null } : {}),
      },
    });

    await this.audit.log({
      actorId: userId,
      action: 'MERCHANT_PROFILE_UPDATED',
      resourceType: 'merchant_profile',
      resourceId: profile.id,
      ipAddress,
      metadata: { changes: Object.keys(dto) } as Prisma.InputJsonValue,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Resolve merchant profile ID for a user (throws if none)
  // ---------------------------------------------------------------------------

  async requireMerchantProfile(userId: string): Promise<MerchantProfile> {
    if (!userId?.trim()) {
      throw new ForbiddenException('Authentication required');
    }

    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new ForbiddenException(
        'Merchant profile required. Create one with POST /merchant/profile',
      );
    }

    if (profile.userId !== userId) {
      this.logger.error(
        { userId, profileUserId: profile.userId, profileId: profile.id },
        'Merchant profile ownership mismatch',
      );
      throw new ForbiddenException('Merchant profile ownership mismatch');
    }

    return profile;
  }
}
