import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FranchiseAuditAction,
  FranchisePartnerStatus,
  FranchiseStoreStatus,
  Prisma,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FranchiseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async resolveFranchiseId(userId: string): Promise<string> {
    const fp = await this.prisma.franchisePartner.findUnique({ where: { userId } });
    if (!fp) throw new ForbiddenException('Franchise partner profile required');
    return fp.id;
  }

  async listFranchises(status?: FranchisePartnerStatus) {
    return this.prisma.franchisePartner.findMany({
      where: status ? { status } : undefined,
      include: {
        city: { select: { name: true } },
        _count: { select: { stores: true, territories: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createFranchise(input: {
    userId: string;
    businessName: string;
    gstin?: string;
    pan?: string;
    cityId?: string;
    commissionPercent?: number;
  }) {
    const existing = await this.prisma.franchisePartner.findUnique({ where: { userId: input.userId } });
    if (existing) throw new BadRequestException('User already has franchise profile');

    const fp = await this.prisma.franchisePartner.create({
      data: {
        userId: input.userId,
        businessName: input.businessName,
        gstin: input.gstin,
        pan: input.pan,
        cityId: input.cityId,
        commissionPercent: input.commissionPercent ?? 10,
        status: FranchisePartnerStatus.PENDING,
      },
    });

    await this.prisma.franchiseAudit.create({
      data: { franchiseId: fp.id, action: FranchiseAuditAction.ONBOARDED },
    });

    return fp;
  }

  async updateFranchise(id: string, input: Partial<{ status: FranchisePartnerStatus; commissionPercent: number; onboardingCompleted: boolean }>, actorId?: string) {
    const fp = await this.prisma.franchisePartner.findUnique({ where: { id } });
    if (!fp) throw new NotFoundException('Franchise not found');

    const updated = await this.prisma.franchisePartner.update({
      where: { id },
      data: input,
    });

    let action: FranchiseAuditAction = FranchiseAuditAction.APPROVED;
    if (input.status === FranchisePartnerStatus.SUSPENDED) action = FranchiseAuditAction.SUSPENDED;
    if (input.status === FranchisePartnerStatus.TERMINATED) action = FranchiseAuditAction.TERMINATED;

    await this.prisma.franchiseAudit.create({
      data: { franchiseId: id, action, actorId, metadata: input as Prisma.InputJsonValue },
    });

    return updated;
  }

  /**
   * Attribute a store to a franchise partner.
   *
   * Territory is exclusive per pincode. If the store sits in a pincode that a
   * *different* active partner already owns exclusively, we do not silently
   * double-attribute and we do not silently hand the store to the territory
   * owner either — the link is parked as PENDING_REVIEW with the reason recorded,
   * an audit row is written, and an admin decides. Parked links earn nothing:
   * settlement only counts ACTIVE ones.
   *
   * The upsert `update` is intentionally empty so re-approving an already-linked
   * store never resurrects a link an admin has REJECTED.
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

  /**
   * The partner's referral code and the invite link they share with merchants.
   * Generates a code on demand for partners created before referral codes existed,
   * so no partner is ever left without a working invite link.
   */
  async getReferral(franchiseId: string) {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      select: { id: true, referralCode: true, businessName: true, city: { select: { name: true } } },
    });
    if (!fp) throw new NotFoundException('Franchise not found');

    const referralCode =
      fp.referralCode ?? (await this.generateReferralCode(fp.id, fp.city?.name ?? fp.businessName));

    const base = this.config.get<string>('merchantSiteUrl') ?? 'https://merchant.jebdekho.com';
    return {
      referralCode,
      inviteUrl: `${base.replace(/\/$/, '')}/?ref=${encodeURIComponent(referralCode)}`,
    };
  }

  /**
   * Assign a unique referral code of the form FR-<CITY>-<NN>. Retries on collision
   * against the unique index rather than trusting a pre-check, so two partners
   * onboarded at the same moment can't be handed the same code.
   */
  private async generateReferralCode(franchiseId: string, cityOrName: string): Promise<string> {
    const slug =
      cityOrName
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3) || 'JD';

    for (let n = 1; n <= 99; n++) {
      const code = `FR-${slug}-${String(n).padStart(2, '0')}`;
      try {
        await this.prisma.franchisePartner.update({
          where: { id: franchiseId },
          data: { referralCode: code },
        });
        return code;
      } catch (err) {
        // P2002 = unique violation on referral_code; try the next number.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
        throw err;
      }
    }
    throw new BadRequestException(`Could not allocate a referral code for ${slug}`);
  }

  /** Merchants this partner recruited, and how far along they are. */
  async getPipeline(franchiseId: string) {
    const applications = await this.prisma.merchantApplication.findMany({
      where: { franchiseId },
      select: {
        id: true,
        status: true,
        businessName: true,
        storeName: true,
        ownerName: true,
        city: true,
        pincode: true,
        referralCode: true,
        submittedAt: true,
        reviewedAt: true,
        createdAt: true,
        storeId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const counts = applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});

    return { total: applications.length, counts, applications };
  }

  /**
   * Stores attributed to this partner, including links parked as PENDING_REVIEW.
   * A partner must be able to see a disputed store and why — otherwise they simply
   * go unpaid for it with no explanation.
   */
  async getLinkedStores(franchiseId: string) {
    const links = await this.prisma.franchiseStore.findMany({
      where: { franchiseId },
      select: {
        id: true,
        status: true,
        conflictReason: true,
        linkedAt: true,
        store: {
          select: { id: true, name: true, slug: true, pincode: true, status: true, isActive: true },
        },
      },
      orderBy: { linkedAt: 'desc' },
    });

    return {
      active: links.filter((l) => l.status === FranchiseStoreStatus.ACTIVE),
      pendingReview: links.filter((l) => l.status === FranchiseStoreStatus.PENDING_REVIEW),
      rejected: links.filter((l) => l.status === FranchiseStoreStatus.REJECTED),
    };
  }

  async getOverview() {
    const [active, pending, suspended, conflicts] = await Promise.all([
      this.prisma.franchisePartner.count({ where: { status: FranchisePartnerStatus.ACTIVE } }),
      this.prisma.franchisePartner.count({ where: { status: FranchisePartnerStatus.PENDING } }),
      this.prisma.franchisePartner.count({ where: { status: FranchisePartnerStatus.SUSPENDED } }),
      this.prisma.territoryConflict.count({ where: { status: 'OPEN' } }),
    ]);
    return { active, pending, suspended, openConflicts: conflicts };
  }
}
