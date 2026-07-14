import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  FranchiseAuditAction,
  FranchisePartnerStatus,
  FranchiseStoreStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * Links an approved store to the franchise partner that recruited it.
 *
 * Deliberately split out of FranchiseService with PrismaService as its ONLY
 * dependency. A store becomes live through TWO different approval paths —
 * merchant-application approval, and the admin store-approval queue — so both must
 * call this. But AdminModule importing FranchiseModule creates a circular module
 * graph (it took the API down once). Because PrismaModule is @Global, a service with
 * no other deps can simply be listed as a provider in both modules, and the cycle
 * never forms.
 */
@Injectable()
export class FranchiseStoreLinkService {
  private readonly logger = new Logger(FranchiseStoreLinkService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Attribute a newly-approved store to the partner whose referral link the merchant
   * signed up through.
   *
   * Reads the referral off the store's application, so it works no matter which
   * approval path got here. Idempotent, and deliberately never throws: broken
   * franchise bookkeeping must not block an otherwise valid store approval.
   */
  async attributeStoreFromApplication(storeId: string, actorId?: string): Promise<void> {
    try {
      const app = await this.prisma.merchantApplication.findFirst({
        where: { storeId, franchiseId: { not: null } },
        select: { id: true, franchiseId: true, referralCode: true },
        orderBy: { createdAt: 'desc' },
      });
      if (!app?.franchiseId) return;

      await this.prisma.store.update({
        where: { id: storeId },
        data: { franchiseId: app.franchiseId, referralCode: app.referralCode },
      });
      await this.linkStore(app.franchiseId, storeId, actorId);

      this.logger.log(
        `Store ${storeId} attributed to franchise ${app.franchiseId} (${app.referralCode}) via application ${app.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Franchise attribution failed for store ${storeId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Create the FranchiseStore row that settlement reads.
   *
   * If the store's pincode sits inside a DIFFERENT active partner's exclusive
   * territory, the link is parked as PENDING_REVIEW with a reason rather than
   * silently double-attributing the store. Parked links earn nothing until an admin
   * resolves them.
   */
  async linkStore(franchiseId: string, storeId: string, actorId?: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, pincode: true },
    });
    if (!store) throw new NotFoundException('Store not found');

    const blockingTerritory = await this.prisma.franchiseTerritory.findFirst({
      where: {
        franchiseId: { not: franchiseId },
        exclusivityEnabled: true,
        pincodes: { has: store.pincode },
        franchise: { status: FranchisePartnerStatus.ACTIVE },
      },
      select: {
        id: true,
        franchiseId: true,
        franchise: { select: { businessName: true } },
      },
    });

    const conflictReason = blockingTerritory
      ? `Pincode ${store.pincode} is in the exclusive territory of ${blockingTerritory.franchise.businessName}`
      : null;

    const link = await this.prisma.franchiseStore.upsert({
      where: { franchiseId_storeId: { franchiseId, storeId } },
      create: {
        franchiseId,
        storeId,
        status: blockingTerritory
          ? FranchiseStoreStatus.PENDING_REVIEW
          : FranchiseStoreStatus.ACTIVE,
        conflictReason,
      },
      update: {},
      include: { store: { select: { name: true, pincode: true } } },
    });

    if (blockingTerritory) {
      await this.prisma.franchiseAudit.create({
        data: {
          franchiseId,
          action: FranchiseAuditAction.CONFLICT_DETECTED,
          actorId,
          metadata: {
            storeId,
            pincode: store.pincode,
            franchiseStoreId: link.id,
            claimedByFranchiseId: franchiseId,
            territoryOwnerFranchiseId: blockingTerritory.franchiseId,
            territoryId: blockingTerritory.id,
            reason: conflictReason,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return link;
  }
}
