import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LocationDirectoryService } from '../location-directory/location-directory.service';
import { MerchantService } from '../merchant/merchant.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import {
  AddDeliveryAreaDto,
  AdminCoverageSearchDto,
  BulkAddDeliveryAreasDto,
  CsvImportRowDto,
  ListDeliveryAreasDto,
  UpdateDeliveryAreaDto,
} from './dto/delivery-coverage.dto';

const DEFAULT_MAX_AREAS = 50;
const MAX_AREAS_KEY = 'delivery.max_areas_per_store';

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CREATED,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAID,
  OrderStatus.MERCHANT_ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.PACKING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.RIDER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.OUT_FOR_DELIVERY,
];

@Injectable()
export class DeliveryCoverageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locations: LocationDirectoryService,
    private readonly merchantService: MerchantService,
    private readonly buyerCache: BuyerCacheService,
  ) {}

  async getMaxAreasPerStore(): Promise<number> {
    const row = await this.prisma.platformSetting.findUnique({
      where: { key: MAX_AREAS_KEY },
    });
    const val = row?.value as { max?: number } | null;
    return val?.max ?? DEFAULT_MAX_AREAS;
  }

  private async assertStoreOwnership(userId: string, storeId: string) {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  private async resolvePincodeMeta(pincode: string) {
    const validated = await this.locations.validatePincode({ pincode });
    const master = await this.prisma.locationPincode.findFirst({
      where: { pincode, isActive: true },
      include: {
        city: { include: { district: { include: { state: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return {
      locationPincodeId: validated.id,
      city: master?.city.name ?? null,
      state: master?.city.district.state.name ?? null,
    };
  }

  private serializeArea(area: {
    id: string;
    pincode: string;
    city: string | null;
    state: string | null;
    deliveryFee: Prisma.Decimal | null;
    minimumOrder: Prisma.Decimal | null;
    estimatedMinutes: number | null;
    priority: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: area.id,
      pincode: area.pincode,
      city: area.city,
      state: area.state,
      deliveryFee: area.deliveryFee != null ? Number(area.deliveryFee) : null,
      minimumOrder: area.minimumOrder != null ? Number(area.minimumOrder) : null,
      estimatedMinutes: area.estimatedMinutes,
      priority: area.priority,
      isActive: area.isActive,
      createdAt: area.createdAt.toISOString(),
      updatedAt: area.updatedAt.toISOString(),
    };
  }

  async listForStore(userId: string, storeId: string, dto: ListDeliveryAreasDto) {
    await this.assertStoreOwnership(userId, storeId);
    const where: Prisma.StoreDeliveryAreaWhereInput = { storeId };
    if (dto.search?.trim()) {
      const q = dto.search.trim();
      where.OR = [
        { pincode: { contains: q } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
      ];
    }
    const skip = ((dto.page ?? 1) - 1) * (dto.limit ?? 50);
    const [items, total, maxAreas] = await Promise.all([
      this.prisma.storeDeliveryArea.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { pincode: 'asc' }],
        skip,
        take: dto.limit ?? 50,
      }),
      this.prisma.storeDeliveryArea.count({ where }),
      this.getMaxAreasPerStore(),
    ]);
    return {
      items: items.map((a) => this.serializeArea(a)),
      total,
      coverageCount: total,
      maxAreas,
    };
  }

  async addArea(userId: string, storeId: string, dto: AddDeliveryAreaDto) {
    await this.assertStoreOwnership(userId, storeId);
    return this.addAreaForStore(storeId, dto);
  }

  private async addAreaForStore(storeId: string, dto: AddDeliveryAreaDto) {
    const [count, maxAreas] = await Promise.all([
      this.prisma.storeDeliveryArea.count({ where: { storeId } }),
      this.getMaxAreasPerStore(),
    ]);
    if (count >= maxAreas) {
      throw new BadRequestException(`Maximum ${maxAreas} delivery pincodes allowed per store`);
    }
    const existing = await this.prisma.storeDeliveryArea.findUnique({
      where: { storeId_pincode: { storeId, pincode: dto.pincode } },
    });
    if (existing) throw new ConflictException('Pincode already in delivery coverage');

    const meta = await this.resolvePincodeMeta(dto.pincode);
    const created = await this.prisma.storeDeliveryArea.create({
      data: {
        storeId,
        pincode: dto.pincode,
        city: meta.city,
        state: meta.state,
        locationPincodeId: meta.locationPincodeId,
        deliveryFee: dto.deliveryFee,
        minimumOrder: dto.minimumOrder,
        estimatedMinutes: dto.estimatedMinutes,
        priority: dto.priority ?? 0,
      },
    });
    await this.invalidateStoreCaches(storeId);
    return this.serializeArea(created);
  }

  async bulkAdd(userId: string, storeId: string, dto: BulkAddDeliveryAreasDto) {
    await this.assertStoreOwnership(userId, storeId);
    const unique = [...new Set(dto.pincodes.map((p) => p.trim()).filter((p) => /^\d{6}$/.test(p)))];
    const results = { added: 0, skipped: 0, errors: [] as string[] };
    for (const pincode of unique) {
      try {
        await this.addArea(userId, storeId, { pincode });
        results.added++;
      } catch (e) {
        if (e instanceof ConflictException) {
          results.skipped++;
        } else {
          results.errors.push(`${pincode}: ${(e as Error).message}`);
        }
      }
    }
    return results;
  }

  async updateArea(
    userId: string,
    storeId: string,
    areaId: string,
    dto: UpdateDeliveryAreaDto,
  ) {
    await this.assertStoreOwnership(userId, storeId);
    const area = await this.prisma.storeDeliveryArea.findFirst({
      where: { id: areaId, storeId },
    });
    if (!area) throw new NotFoundException('Delivery area not found');

    const updated = await this.prisma.storeDeliveryArea.update({
      where: { id: areaId },
      data: {
        ...(dto.deliveryFee !== undefined && { deliveryFee: dto.deliveryFee }),
        ...(dto.minimumOrder !== undefined && { minimumOrder: dto.minimumOrder }),
        ...(dto.estimatedMinutes !== undefined && { estimatedMinutes: dto.estimatedMinutes }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    await this.invalidateStoreCaches(storeId);
    return this.serializeArea(updated);
  }

  async removeArea(userId: string, storeId: string, areaId: string) {
    await this.assertStoreOwnership(userId, storeId);
    const area = await this.prisma.storeDeliveryArea.findFirst({
      where: { id: areaId, storeId },
    });
    if (!area) throw new NotFoundException('Delivery area not found');

    const activeOrders = await this.prisma.order.count({
      where: {
        storeId,
        status: { in: ACTIVE_ORDER_STATUSES },
        deliveryAddress: {
          path: ['pincode'],
          equals: area.pincode,
        },
      },
    });
    if (activeOrders > 0) {
      throw new BadRequestException(
        'Cannot remove pincode with active orders. Deactivate instead.',
      );
    }

    await this.prisma.storeDeliveryArea.delete({ where: { id: areaId } });
    await this.invalidateStoreCaches(storeId);
    return { deleted: true };
  }

  parseCsv(content: string): CsvImportRowDto[] {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('pincode');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const rows: CsvImportRowDto[] = [];
    for (const line of dataLines) {
      const cols = line.split(',').map((c) => c.trim());
      const pincode = cols[0];
      if (!/^\d{6}$/.test(pincode)) continue;
      rows.push({
        pincode,
        deliveryFee: cols[1] ? Number(cols[1]) : undefined,
        minimumOrder: cols[2] ? Number(cols[2]) : undefined,
        estimatedMinutes: cols[3] ? Number(cols[3]) : undefined,
        priority: cols[4] ? Number(cols[4]) : undefined,
      });
    }
    return rows;
  }

  async importCsv(userId: string, storeId: string, csvContent: string) {
    await this.assertStoreOwnership(userId, storeId);
    return this.importCsvForStore(storeId, csvContent);
  }

  async adminImportCsv(storeId: string, csvContent: string) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
    });
    if (!store) throw new NotFoundException('Store not found');
    return this.importCsvForStore(storeId, csvContent);
  }

  private async importCsvForStore(storeId: string, csvContent: string) {
    const rows = this.parseCsv(csvContent);
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await this.addAreaForStore(storeId, row);
        added++;
      } catch (e) {
        if (e instanceof ConflictException) skipped++;
        else errors.push(`${row.pincode}: ${(e as Error).message}`);
      }
    }
    return { added, skipped, errors, total: rows.length };
  }

  async exportCsv(userId: string, storeId: string): Promise<string> {
    const { items } = await this.listForStore(userId, storeId, { page: 1, limit: 500 });
    const header = 'pincode,delivery_fee,minimum_order,eta_minutes,priority,is_active';
    const lines = items.map(
      (a) =>
        `${a.pincode},${a.deliveryFee ?? ''},${a.minimumOrder ?? ''},${a.estimatedMinutes ?? ''},${a.priority},${a.isActive}`,
    );
    return [header, ...lines].join('\n');
  }

  async seedFromPincodes(
    storeId: string,
    pincodes: string[],
    defaults?: { deliveryFee?: number; minimumOrder?: number; estimatedMinutes?: number },
  ) {
    const unique = [...new Set(pincodes.filter((p) => /^\d{6}$/.test(p)))];
    for (const pincode of unique) {
      const exists = await this.prisma.storeDeliveryArea.findUnique({
        where: { storeId_pincode: { storeId, pincode } },
      });
      if (exists) continue;
      try {
        const meta = await this.resolvePincodeMeta(pincode);
        await this.prisma.storeDeliveryArea.create({
          data: {
            storeId,
            pincode,
            city: meta.city,
            state: meta.state,
            locationPincodeId: meta.locationPincodeId,
            deliveryFee: defaults?.deliveryFee,
            minimumOrder: defaults?.minimumOrder,
            estimatedMinutes: defaults?.estimatedMinutes,
          },
        });
      } catch {
        // skip invalid master pincodes during bulk seed
      }
    }
    await this.invalidateStoreCaches(storeId);
  }

  async getMerchantAnalytics(userId: string, storeId: string) {
    await this.assertStoreOwnership(userId, storeId);
    const areas = await this.prisma.storeDeliveryArea.findMany({
      where: { storeId, isActive: true },
      select: { pincode: true },
    });
    const pincodes = areas.map((a) => a.pincode);

    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
      },
      select: { deliveryAddress: true, totalAmount: true },
      take: 5000,
      orderBy: { createdAt: 'desc' },
    });

    const pincodeStats = new Map<string, { orders: number; revenue: number }>();
    for (const row of orders) {
      const addr = row.deliveryAddress as { pincode?: string } | null;
      const pc = addr?.pincode;
      if (!pc || !pincodes.includes(pc)) continue;
      const prev = pincodeStats.get(pc) ?? { orders: 0, revenue: 0 };
      pincodeStats.set(pc, {
        orders: prev.orders + 1,
        revenue: prev.revenue + Number(row.totalAmount),
      });
    }

    const statsArr = [...pincodeStats.entries()].map(([pincode, s]) => ({
      pincode,
      orders: s.orders,
      revenue: s.revenue,
    }));

    const top = [...statsArr].sort((a, b) => b.orders - a.orders).slice(0, 10);
    const lowest = [...statsArr].filter((s) => s.orders > 0).sort((a, b) => a.orders - b.orders).slice(0, 10);

    return {
      coverageCount: areas.length,
      reachPincodes: pincodes.length,
      topPincodes: top,
      lowestPerformingPincodes: lowest,
      ordersByPincode: statsArr,
    };
  }

  async getAdminOverview() {
    const [
      totalAreas,
      activeAreas,
      storeCount,
      masterPincodes,
      activeMaster,
      topCovered,
      leastCovered,
    ] = await Promise.all([
      this.prisma.storeDeliveryArea.count(),
      this.prisma.storeDeliveryArea.count({ where: { isActive: true } }),
      this.prisma.store.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.locationPincode.count(),
      this.prisma.locationPincode.count({ where: { isActive: true } }),
      this.prisma.storeDeliveryArea.groupBy({
        by: ['pincode'],
        where: { isActive: true },
        _count: { storeId: true },
        orderBy: { _count: { storeId: 'desc' } },
        take: 15,
      }),
      this.prisma.storeDeliveryArea.groupBy({
        by: ['pincode'],
        where: { isActive: true },
        _count: { storeId: true },
        orderBy: { _count: { storeId: 'asc' } },
        take: 15,
      }),
    ]);

    const servedPincodes = await this.prisma.storeDeliveryArea.findMany({
      where: { isActive: true },
      distinct: ['pincode'],
      select: { pincode: true },
    });

    const coveragePct =
      activeMaster > 0
        ? Math.round((servedPincodes.length / activeMaster) * 1000) / 10
        : 0;

    return {
      totalCoverageRows: totalAreas,
      activeCoverageRows: activeAreas,
      activeStores: storeCount,
      masterPincodes,
      activeMasterPincodes: activeMaster,
      servedPincodeCount: servedPincodes.length,
      coveragePercent: coveragePct,
      unservedPincodeCount: Math.max(0, activeMaster - servedPincodes.length),
      topCoveredAreas: topCovered.map((r) => ({
        pincode: r.pincode,
        storeCount: r._count.storeId,
      })),
      leastCoveredAreas: leastCovered.map((r) => ({
        pincode: r.pincode,
        storeCount: r._count.storeId,
      })),
    };
  }

  async adminSearchCoverage(dto: AdminCoverageSearchDto) {
    const where: Prisma.StoreDeliveryAreaWhereInput = {};
    if (dto.pincode) where.pincode = { contains: dto.pincode };
    if (dto.city) where.city = { contains: dto.city, mode: 'insensitive' };
    const skip = ((dto.page ?? 1) - 1) * (dto.limit ?? 50);
    const [items, total] = await Promise.all([
      this.prisma.storeDeliveryArea.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { pincode: 'asc' },
        skip,
        take: dto.limit ?? 50,
      }),
      this.prisma.storeDeliveryArea.count({ where }),
    ]);
    return {
      items: items.map((a) => ({
        ...this.serializeArea(a),
        store: a.store,
      })),
      total,
    };
  }

  async adminSetPincodeActive(pincode: string, isActive: boolean, adminUserId: string) {
    const rows = await this.prisma.locationPincode.findMany({ where: { pincode } });
    if (rows.length === 0) throw new NotFoundException('Pincode not in master directory');
    await this.prisma.locationPincode.updateMany({
      where: { pincode },
      data: { isActive },
    });
    if (!isActive) {
      await this.prisma.storeDeliveryArea.updateMany({
        where: { pincode },
        data: { isActive: false },
      });
    }
    await this.buyerCache.deleteByPattern('buyer:stores:*');
    return { pincode, isActive, updatedBy: adminUserId, records: rows.length };
  }

  async findStoreIdsForPincode(pincode: string): Promise<string[]> {
    const rows = await this.prisma.storeDeliveryArea.findMany({
      where: {
        pincode,
        isActive: true,
        store: {
          status: 'APPROVED',
          isActive: true,
          deletedAt: null,
        },
      },
      select: { storeId: true },
      distinct: ['storeId'],
    });
    return rows.map((r) => r.storeId);
  }

  private async invalidateStoreCaches(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });
    await this.buyerCache.deleteByPattern('buyer:stores:*');
    if (store?.slug) await this.buyerCache.invalidate(`buyer:store:${store.slug}`);
  }
}
