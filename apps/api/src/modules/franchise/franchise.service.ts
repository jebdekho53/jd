import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FranchiseAuditAction,
  FranchisePartnerStatus,
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

  async linkStore(franchiseId: string, storeId: string) {
    return this.prisma.franchiseStore.upsert({
      where: { franchiseId_storeId: { franchiseId, storeId } },
      create: { franchiseId, storeId },
      update: {},
      include: { store: { select: { name: true, pincode: true } } },
    });
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
