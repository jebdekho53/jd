import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FranchiseAuditAction,
  FranchisePartnerStatus,
  FranchiseStoreStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FranchiseService {
  constructor(private readonly prisma: PrismaService) {}

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
        commissionPercent: input.commissionPercent ?? 5,
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
