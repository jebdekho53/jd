import { InventoryStatus } from '@prisma/client';
import { InventoryService } from './inventory.service';
import type { PrismaService } from '../../database/prisma.service';
import type { InventoryCacheService } from './inventory-cache.service';
import type { InventoryAlertService } from './inventory-alert.service';
import type { AuditService } from '../audit/audit.service';

/**
 * Regression cover for the offline-sale gap: Jebdekho only ever learns about
 * sales that go through it, so a merchant's in-store sales silently drift
 * available stock away from actual stock until an online order oversells
 * against units that are already gone. recordOfflineSale is the fix — these
 * tests lock down both that it actually decrements stock and audit-logs
 * every time (unlike the pre-existing raw adjust path, which has no audit
 * trail at all), and that reporting more units sold than were tracked as
 * available clamps to zero instead of going negative or crashing.
 */
function buildInventoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    variantId: 'variant-1',
    availableQty: 20,
    reservedQty: 0,
    soldQty: 0,
    lowStockThreshold: 5,
    status: InventoryStatus.ACTIVE,
    version: 0,
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildHarness(inventoryRow = buildInventoryRow()) {
  const prisma = {
    inventory: {
      findUnique: jest.fn().mockResolvedValue(inventoryRow),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...inventoryRow, ...data, version: (inventoryRow.version as number) + 1 }),
      ),
    },
    productVariant: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ productId: 'product-1' }),
    },
  } as unknown as PrismaService;

  const cache = { invalidateForStores: jest.fn() } as unknown as InventoryCacheService;
  const alerts = { checkAndNotifyLowStock: jest.fn().mockResolvedValue(undefined) } as unknown as InventoryAlertService;
  const events = { emit: jest.fn() } as unknown as import('@nestjs/event-emitter').EventEmitter2;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  const service = new InventoryService(prisma, cache, alerts, events, audit);
  return { service, prisma, cache, alerts, events, audit };
}

describe('InventoryService.recordOfflineSale', () => {
  it('decrements available stock and writes an audit log entry for the offline sale', async () => {
    const { service, prisma, audit } = buildHarness(buildInventoryRow({ availableQty: 20 }));

    const result = await service.recordOfflineSale('variant-1', 5, 'user-1', 'Cash sale', {
      ipAddress: '1.2.3.4',
    });

    expect(result.availableQty).toBe(15);
    expect(result.shortfall).toBe(0);
    expect(result.status).toBe(InventoryStatus.ACTIVE);

    expect(prisma.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { variantId: 'variant-1' },
        data: expect.objectContaining({ availableQty: 15, status: InventoryStatus.ACTIVE }),
      }),
    );

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        action: 'INVENTORY_OFFLINE_SALE_RECORDED',
        resourceType: 'inventory',
        resourceId: 'variant-1',
        ipAddress: '1.2.3.4',
        metadata: expect.objectContaining({
          quantitySold: 5,
          previousAvailableQty: 20,
          newAvailableQty: 15,
          shortfall: 0,
          note: 'Cash sale',
        }),
      }),
    );
  });

  it('clamps to zero and reports a shortfall when more units are reported sold than were tracked as available', async () => {
    const { service, prisma, audit } = buildHarness(buildInventoryRow({ availableQty: 3 }));

    const result = await service.recordOfflineSale('variant-1', 10, 'user-1', undefined);

    expect(result.availableQty).toBe(0);
    expect(result.shortfall).toBe(7);
    expect(result.status).toBe(InventoryStatus.OUT_OF_STOCK);

    expect(prisma.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ availableQty: 0 }) }),
    );

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          quantitySold: 10,
          previousAvailableQty: 3,
          newAvailableQty: 0,
          shortfall: 7,
          note: null,
        }),
      }),
    );
  });

  it('never goes negative even when reporting a large offline sale against a small stock count', async () => {
    const { service } = buildHarness(buildInventoryRow({ availableQty: 1 }));

    const result = await service.recordOfflineSale('variant-1', 1000, 'user-1', undefined);

    expect(result.availableQty).toBe(0);
    expect(result.shortfall).toBe(999);
  });

  it('throws instead of writing anything when the variant has no inventory row', async () => {
    const { service, prisma, audit } = buildHarness();
    (prisma.inventory.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.recordOfflineSale('missing-variant', 1, 'user-1', undefined),
    ).rejects.toThrow();
    expect(prisma.inventory.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
