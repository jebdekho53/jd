import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  StoreBusinessTypeStatus,
  StoreStatus,
  VerticalBusinessType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VerticalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listStoreBusinessTypes(storeId: string) {
    return this.prisma.storeBusinessType.findMany({
      where: { storeId },
      orderBy: [{ isPrimary: 'desc' }, { businessType: 'asc' }],
    });
  }

  async setStoreBusinessTypes(
    storeId: string,
    types: VerticalBusinessType[],
    primary?: VerticalBusinessType,
  ) {
    if (types.length === 0) {
      throw new BadRequestException('At least one business type is required');
    }
    const primaryType = primary ?? types[0];
    if (!types.includes(primaryType)) {
      throw new BadRequestException('Primary business type must be in the selected types');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.storeBusinessType.findMany({ where: { storeId } });
      const existingMap = new Map(existing.map((e) => [e.businessType, e]));

      for (const type of types) {
        const prev = existingMap.get(type);
        if (prev) {
          await tx.storeBusinessType.update({
            where: { id: prev.id },
            data: { isPrimary: type === primaryType },
          });
        } else {
          await tx.storeBusinessType.create({
            data: {
              storeId,
              businessType: type,
              status: StoreBusinessTypeStatus.PENDING,
              isPrimary: type === primaryType,
            },
          });
        }
      }

      const toRemove = existing.filter((e) => !types.includes(e.businessType));
      for (const row of toRemove) {
        await tx.storeBusinessType.delete({ where: { id: row.id } });
      }
    });

    return this.listStoreBusinessTypes(storeId);
  }

  async approveStoreBusinessType(
    storeId: string,
    businessType: VerticalBusinessType,
    adminId: string,
  ) {
    const row = await this.prisma.storeBusinessType.findUnique({
      where: { storeId_businessType: { storeId, businessType } },
    });
    if (!row) throw new NotFoundException('Store business type not found');

    const updated = await this.prisma.storeBusinessType.update({
      where: { id: row.id },
      data: {
        status: StoreBusinessTypeStatus.APPROVED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    await this.audit.log({
      actorId: adminId,
      action: 'STORE_BUSINESS_TYPE_APPROVED',
      resourceType: 'StoreBusinessType',
      resourceId: row.id,
      metadata: { storeId, businessType },
    });

    return updated;
  }

  async rejectStoreBusinessType(
    storeId: string,
    businessType: VerticalBusinessType,
    adminId: string,
    reason: string,
  ) {
    const row = await this.prisma.storeBusinessType.findUnique({
      where: { storeId_businessType: { storeId, businessType } },
    });
    if (!row) throw new NotFoundException('Store business type not found');

    return this.prisma.storeBusinessType.update({
      where: { id: row.id },
      data: {
        status: StoreBusinessTypeStatus.REJECTED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  async syncApplicationBusinessTypes(applicationId: string, types: VerticalBusinessType[]) {
    if (types.length === 0) return [];
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.merchantApplicationBusinessType.findMany({
        where: { applicationId },
      });
      const existingSet = new Set(existing.map((e) => e.businessType));
      for (const type of types) {
        if (!existingSet.has(type)) {
          await tx.merchantApplicationBusinessType.create({
            data: { applicationId, businessType: type },
          });
        }
      }
    });
    return this.prisma.merchantApplicationBusinessType.findMany({
      where: { applicationId },
    });
  }

  async copyApprovedTypesToStore(storeId: string, applicationId: string) {
    const appTypes = await this.prisma.merchantApplicationBusinessType.findMany({
      where: { applicationId, status: StoreBusinessTypeStatus.APPROVED },
    });
    if (appTypes.length === 0) return [];
    return this.setStoreBusinessTypes(
      storeId,
      appTypes.map((t) => t.businessType),
      appTypes[0]?.businessType,
    );
  }

  async findStoresByVertical(
    businessType: VerticalBusinessType,
    opts: { lat?: number; lng?: number; limit?: number; page?: number } = {},
  ) {
    const limit = opts.limit ?? 20;
    const page = opts.page ?? 1;
    const stores = await this.prisma.store.findMany({
      where: {
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
        businessTypes: {
          some: { businessType, status: StoreBusinessTypeStatus.APPROVED },
        },
      },
      include: {
        businessTypes: { where: { status: StoreBusinessTypeStatus.APPROVED } },
        restaurantProfile: { include: { cuisines: { include: { cuisine: true } } } },
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
    });
    return stores;
  }
}
