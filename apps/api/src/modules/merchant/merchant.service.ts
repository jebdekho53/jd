import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus, MerchantProfile, Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VerificationBlocklistService } from './verification-blocklist.service';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly blocklist: VerificationBlocklistService,
  ) {}

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
