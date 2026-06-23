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
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
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

    const merchantRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: RoleName.MERCHANT },
    });

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

      // Assign MERCHANT role (idempotent)
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: merchantRole.id } },
        update: {},
        create: { userId, roleId: merchantRole.id },
      });

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
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Merchant profile not found');
    }

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
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException(
        'Merchant profile required. Create one with POST /merchant/profile',
      );
    }
    return profile;
  }
}
