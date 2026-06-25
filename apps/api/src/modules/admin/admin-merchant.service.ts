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
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { RemoveBlacklistDto } from './dto/remove-blacklist.dto';

@Injectable()
export class AdminMerchantService {
  private readonly logger = new Logger(AdminMerchantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly blocklist: VerificationBlocklistService,
  ) {}

  async removeBlacklist(
    superAdminUserId: string,
    merchantProfileId: string,
    dto: RemoveBlacklistDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ merchantProfileId: string; isBlacklisted: boolean; reopenedStoreId?: string }> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantProfileId },
      include: {
        user: { select: { phone: true, email: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Merchant profile not found: ${merchantProfileId}`);
    }

    if (!profile.isBlacklisted) {
      throw new BadRequestException('Merchant is not blacklisted.');
    }

    const now = new Date();

    await this.prisma.merchantProfile.update({
      where: { id: merchantProfileId },
      data: {
        isBlacklisted: false,
        blacklistReason: null,
        blacklistedAt: null,
        blacklistedBy: null,
        blacklistRemovedAt: now,
        blacklistRemovedBy: superAdminUserId,
      },
    });

    await this.blocklist.removeMerchantIdentifiers({
      phone: profile.user.phone,
      email: profile.user.email,
      gstNumber: profile.gstNumber,
      panNumber: profile.panNumber,
    });

    let reopenedStoreId: string | undefined;

    if (dto.reopenStoreId) {
      const store = await this.prisma.store.findFirst({
        where: {
          id: dto.reopenStoreId,
          merchantProfileId,
          deletedAt: null,
        },
      });

      if (!store) {
        throw new NotFoundException(
          `Store ${dto.reopenStoreId} not found for this merchant.`,
        );
      }

      await this.prisma.store.update({
        where: { id: dto.reopenStoreId },
        data: {
          status: StoreStatus.UNDER_REVIEW,
          isActive: false,
          reviewedAt: now,
          reviewedBy: superAdminUserId,
        },
      });

      reopenedStoreId = dto.reopenStoreId;
    }

    await Promise.all([
      this.audit.log({
        actorId: superAdminUserId,
        action: 'MERCHANT_BLACKLIST_REMOVED',
        resourceType: 'merchant_profile',
        resourceId: merchantProfileId,
        ipAddress,
        userAgent,
        metadata: {
          reason: dto.reason,
          reopenedStoreId: reopenedStoreId ?? null,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.MERCHANT_BLACKLIST_REMOVED,
        'merchant_profile',
        merchantProfileId,
        {
          reason: dto.reason,
          removedBy: superAdminUserId,
          reopenedStoreId: reopenedStoreId ?? null,
        },
        { userId: superAdminUserId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log({ superAdminUserId, merchantProfileId }, 'Merchant blacklist removed');
    return { merchantProfileId, isBlacklisted: false, reopenedStoreId };
  }
}
