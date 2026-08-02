import { ProductService } from './product.service';
import type { PrismaService } from '../../database/prisma.service';
import type { MerchantService } from '../merchant/merchant.service';
import type { InventoryService } from '../inventory/inventory.service';
import type { AuditService } from '../audit/audit.service';
import type { DomainEventsService } from '../domain-events/domain-events.service';

/**
 * ProductService.recordOfflineSale is a thin orchestration layer over
 * InventoryService.recordOfflineSale (which owns the actual decrement +
 * audit log, covered in inventory.service.spec.ts): assert store/variant
 * ownership, delegate the real work, emit the same INVENTORY_CHANGED
 * domain event updateInventory already emits, and surface the shortfall
 * the merchant needs to see when their in-store sale count didn't match
 * what was tracked as available online.
 */
function buildHarness(overrides: {
  inventory?: Record<string, unknown>;
  variant?: Record<string, unknown> | null;
  store?: Record<string, unknown> | null;
  recordOfflineSaleResult?: Record<string, unknown>;
} = {}) {
  const inventoryRow = {
    id: 'inv-1',
    variantId: 'variant-1',
    availableQty: 15,
    reservedQty: 0,
    soldQty: 0,
    lowStockThreshold: 5,
    status: 'ACTIVE',
    ...overrides.inventory,
  };

  // Mirrors reality: inventoryService.recordOfflineSale (mocked below) is the
  // call that actually writes the new quantity, so a findUniqueOrThrow taken
  // *after* it resolves must reflect that same post-write state.
  const recordOfflineSaleResult = overrides.recordOfflineSaleResult ?? {
    availableQty: 10,
    reservedQty: 0,
    soldQty: 0,
    status: 'ACTIVE',
    shortfall: 0,
  };

  const prisma = {
    store: {
      findFirst: jest.fn().mockResolvedValue(
        overrides.store !== undefined ? overrides.store : { id: 'store-1', merchantProfileId: 'profile-1' },
      ),
    },
    productVariant: {
      findFirst: jest.fn().mockResolvedValue(
        overrides.variant !== undefined ? overrides.variant : { id: 'variant-1', productId: 'product-1' },
      ),
    },
    inventory: {
      findUnique: jest.fn().mockResolvedValue(inventoryRow),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ ...inventoryRow, ...recordOfflineSaleResult }),
    },
  } as unknown as PrismaService;

  const merchantService = {
    requireMerchantProfile: jest.fn().mockResolvedValue({ id: 'profile-1' }),
  } as unknown as MerchantService;

  const inventoryService = {
    recordOfflineSale: jest.fn().mockResolvedValue(recordOfflineSaleResult),
  } as unknown as InventoryService;

  const domainEvents = { emit: jest.fn().mockResolvedValue(undefined) } as unknown as DomainEventsService;
  const audit = {} as unknown as AuditService;
  const storeCategoryAccess = {} as never;
  const inventoryCache = {} as never;

  const service = new ProductService(
    prisma,
    merchantService,
    audit,
    domainEvents,
    storeCategoryAccess,
    inventoryService,
    inventoryCache,
  );

  return { service, prisma, merchantService, inventoryService, domainEvents };
}

describe('ProductService.recordOfflineSale', () => {
  it('decrements stock via InventoryService and returns the updated quantity with no shortfall', async () => {
    const { service, inventoryService } = buildHarness({
      recordOfflineSaleResult: { availableQty: 10, reservedQty: 0, soldQty: 0, status: 'ACTIVE', shortfall: 0 },
    });

    const result = await service.recordOfflineSale(
      'user-1',
      'store-1',
      'product-1',
      'variant-1',
      5,
      'Cash sale',
      '1.2.3.4',
    );

    expect(inventoryService.recordOfflineSale).toHaveBeenCalledWith(
      'variant-1',
      5,
      'user-1',
      'Cash sale',
      { ipAddress: '1.2.3.4' },
    );
    expect(result.availableQty).toBe(10);
    expect(result.shortfall).toBe(0);
  });

  it('surfaces the shortfall returned by InventoryService when the offline sale exceeded tracked stock', async () => {
    const { service } = buildHarness({
      recordOfflineSaleResult: { availableQty: 0, reservedQty: 0, soldQty: 0, status: 'OUT_OF_STOCK', shortfall: 7 },
    });

    const result = await service.recordOfflineSale(
      'user-1',
      'store-1',
      'product-1',
      'variant-1',
      10,
      undefined,
      '1.2.3.4',
    );

    expect(result.availableQty).toBe(0);
    expect(result.shortfall).toBe(7);
  });

  it('emits an INVENTORY_CHANGED domain event reflecting the previous and new quantity', async () => {
    const { service, domainEvents } = buildHarness({
      inventory: { availableQty: 15, lowStockThreshold: 5 },
      recordOfflineSaleResult: { availableQty: 10, reservedQty: 0, soldQty: 0, status: 'ACTIVE', shortfall: 0 },
    });

    await service.recordOfflineSale('user-1', 'store-1', 'product-1', 'variant-1', 5, undefined, '1.2.3.4');

    expect(domainEvents.emit).toHaveBeenCalledWith(
      'INVENTORY_CHANGED',
      'inventory',
      'inv-1',
      expect.objectContaining({
        productId: 'product-1',
        variantId: 'variant-1',
        storeId: 'store-1',
        previousQty: 15,
        newQty: 10,
      }),
      { userId: 'user-1', ipAddress: '1.2.3.4' },
    );
  });

  it('rejects when the store is not owned by the caller, without touching inventory', async () => {
    const { service, inventoryService } = buildHarness({ store: null });

    await expect(
      service.recordOfflineSale('user-1', 'store-1', 'product-1', 'variant-1', 5, undefined),
    ).rejects.toThrow();
    expect(inventoryService.recordOfflineSale).not.toHaveBeenCalled();
  });

  it('rejects when the variant does not belong to the product/store, without touching inventory', async () => {
    const { service, inventoryService } = buildHarness({ variant: null });

    await expect(
      service.recordOfflineSale('user-1', 'store-1', 'product-1', 'variant-1', 5, undefined),
    ).rejects.toThrow();
    expect(inventoryService.recordOfflineSale).not.toHaveBeenCalled();
  });
});
