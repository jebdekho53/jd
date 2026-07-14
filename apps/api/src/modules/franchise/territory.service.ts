import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FranchiseAuditAction,
  FranchisePartnerStatus,
  FranchiseStoreStatus,
  Prisma,
  TerritoryConflictStatus,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { FRANCHISE_EVENTS } from './franchise.events';

/**
 * Either the root client or an interactive-transaction client. Territory assignment
 * has to be able to run inside the lead-approval transaction, so that a partner, its
 * territory and any detected conflict all commit or roll back together.
 */
type PrismaLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class TerritoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async assignTerritory(
    franchiseId: string,
    input: {
      city: string;
      state: string;
      pincodes: string[];
      exclusivityEnabled?: boolean;
      launchDate?: Date;
    },
    actorId?: string,
    db: PrismaLike = this.prisma,
  ) {
    const territory = await db.franchiseTerritory.create({
      data: {
        franchiseId,
        city: input.city,
        state: input.state,
        pincodes: input.pincodes,
        exclusivityEnabled: input.exclusivityEnabled ?? false,
        launchDate: input.launchDate,
      },
    });

    const conflicts = await this.detectOverlap(
      territory.id,
      franchiseId,
      input.pincodes,
      input.exclusivityEnabled ?? false,
      db,
    );

    await db.franchiseAudit.create({
      data: {
        franchiseId,
        action: conflicts.length > 0 ? FranchiseAuditAction.CONFLICT_DETECTED : FranchiseAuditAction.TERRITORY_ASSIGNED,
        actorId,
        metadata: { territoryId: territory.id, conflicts: conflicts.length } as Prisma.InputJsonValue,
      },
    });

    return { territory, conflicts };
  }

  async detectOverlap(
    territoryId: string,
    franchiseId: string,
    pincodes: string[],
    exclusivityEnabled: boolean,
    db: PrismaLike = this.prisma,
  ) {
    if (!exclusivityEnabled || pincodes.length === 0) return [];

    const others = await db.franchiseTerritory.findMany({
      where: {
        id: { not: territoryId },
        exclusivityEnabled: true,
        franchise: { status: FranchisePartnerStatus.ACTIVE },
      },
      include: { franchise: { select: { businessName: true } } },
    });

    const conflicts = [];
    for (const other of others) {
      const overlap = pincodes.filter((p) => other.pincodes.includes(p));
      for (const pincode of overlap) {
        const existing = await db.territoryConflict.findFirst({
          where: {
            pincode,
            primaryTerritoryId: territoryId,
            conflictingTerritoryId: other.id,
            status: 'OPEN',
          },
        });
        if (existing) continue;

        const conflict = await db.territoryConflict.create({
          data: {
            franchiseId,
            primaryTerritoryId: territoryId,
            conflictingTerritoryId: other.id,
            pincode,
          },
        });
        conflicts.push(conflict);
      }
    }
    return conflicts;
  }

  /**
   * Resolve a parked store attribution.
   *
   * This is the only thing that actually moves money: a PENDING_REVIEW link earns
   * the partner nothing, so until an admin decides here, the store they recruited
   * is worth zero to them. APPROVE credits the recruiter; REJECT means they never
   * get paid for it — which is why a reason is required either way.
   */
  async resolveStoreLink(
    adminId: string,
    linkId: string,
    input: { approve: boolean; reason: string },
  ) {
    const link = await this.prisma.franchiseStore.findUnique({
      where: { id: linkId },
      include: { store: { select: { name: true } } },
    });
    if (!link) throw new NotFoundException('Store attribution not found');
    if (link.status !== FranchiseStoreStatus.PENDING_REVIEW) {
      throw new BadRequestException('This attribution is not awaiting review');
    }

    const updated = await this.prisma.franchiseStore.update({
      where: { id: linkId },
      data: {
        status: input.approve ? FranchiseStoreStatus.ACTIVE : FranchiseStoreStatus.REJECTED,
        conflictReason: input.reason,
      },
    });

    await this.prisma.franchiseAudit.create({
      data: {
        franchiseId: link.franchiseId,
        action: FranchiseAuditAction.CONFLICT_DETECTED,
        actorId: adminId,
        metadata: {
          resolved: true,
          franchiseStoreId: linkId,
          storeId: link.storeId,
          decision: input.approve ? 'APPROVED' : 'REJECTED',
          reason: input.reason,
        } as Prisma.InputJsonValue,
      },
    });

    this.events.emit(
      input.approve ? FRANCHISE_EVENTS.STORE_LINKED : FRANCHISE_EVENTS.STORE_DISPUTED,
      {
        franchiseId: link.franchiseId,
        storeName: link.store.name,
        reason: input.approve ? null : input.reason,
      },
    );

    return updated;
  }

  /** Store attributions parked because of an exclusive-territory clash. */
  async listPendingStoreLinks() {
    return this.prisma.franchiseStore.findMany({
      where: { status: FranchiseStoreStatus.PENDING_REVIEW },
      include: {
        franchise: { select: { id: true, businessName: true, referralCode: true } },
        store: { select: { id: true, name: true, pincode: true } },
      },
      orderBy: { linkedAt: 'asc' },
      take: 100,
    });
  }

  /** Close a territory-vs-territory conflict with a written resolution. */
  async resolveConflict(adminId: string, conflictId: string, resolution: string) {
    const conflict = await this.prisma.territoryConflict.findUnique({
      where: { id: conflictId },
    });
    if (!conflict) throw new NotFoundException('Conflict not found');

    const updated = await this.prisma.territoryConflict.update({
      where: { id: conflictId },
      data: {
        status: TerritoryConflictStatus.RESOLVED,
        resolution,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.franchiseAudit.create({
      data: {
        franchiseId: conflict.franchiseId,
        action: FranchiseAuditAction.CONFLICT_DETECTED,
        actorId: adminId,
        metadata: { conflictId, resolved: true, resolution } as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  async listConflicts() {
    return this.prisma.territoryConflict.findMany({
      where: { status: 'OPEN' },
      include: {
        franchise: { select: { businessName: true } },
        primaryTerritory: true,
        conflictingTerritory: { include: { franchise: { select: { businessName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async previewConflicts(pincodes: string[], excludeFranchiseId?: string) {
    const uniquePincodes = [...new Set(pincodes)];
    if (uniquePincodes.length === 0) return [];

    const territories = await this.prisma.franchiseTerritory.findMany({
      where: {
        ...(excludeFranchiseId ? { franchiseId: { not: excludeFranchiseId } } : {}),
        exclusivityEnabled: true,
        franchise: { status: FranchisePartnerStatus.ACTIVE },
      },
      include: { franchise: { select: { id: true, businessName: true, referralCode: true } } },
    });

    return territories.flatMap((territory) =>
      uniquePincodes
        .filter((pincode) => territory.pincodes.includes(pincode))
        .map((pincode) => ({
          pincode,
          territoryId: territory.id,
          franchiseId: territory.franchiseId,
          franchise: territory.franchise,
          city: territory.city,
          state: territory.state,
        })),
    );
  }

  async getTerritoriesForMap() {
    return this.prisma.franchiseTerritory.findMany({
      where: { franchise: { status: FranchisePartnerStatus.ACTIVE } },
      include: {
        franchise: { select: { id: true, businessName: true } },
      },
      take: 200,
    });
  }
}
