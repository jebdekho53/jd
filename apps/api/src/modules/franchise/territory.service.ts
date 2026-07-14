import { Injectable } from '@nestjs/common';
import { FranchiseAuditAction, FranchisePartnerStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * Either the root client or an interactive-transaction client. Territory assignment
 * has to be able to run inside the lead-approval transaction, so that a partner, its
 * territory and any detected conflict all commit or roll back together.
 */
type PrismaLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class TerritoryService {
  constructor(private readonly prisma: PrismaService) {}

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
