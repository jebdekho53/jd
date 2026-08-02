import { OfflineBillingService } from './offline-billing.service';
import type { PrismaService } from '../../database/prisma.service';
import type { MerchantService } from '../merchant/merchant.service';
import type { InventoryService } from '../inventory/inventory.service';
import type { DomainEventsService } from '../domain-events/domain-events.service';
import type { CreateOfflineBillDto } from './dto/offline-bill.dto';

/**
 * OfflineBillingService.createBill rings up one or more existing products/variants
 * in a single walk-in-customer transaction: each line reuses InventoryService.recordOfflineSale
 * (the same tested, oversell-safe decrement used by the single-item quick action), and the
 * OfflineBill/OfflineBillItem rows are only persisted after those decrements succeed.
 */
function buildHarness(overrides: {
  store?: Record<string, unknown> | null;
  variants?: Array<Record<string, unknown>>;
  recordOfflineSaleResults?: Record<string, { availableQty: number; reservedQty: number; soldQty: number; status: string; shortfall: number }>;
} = {}) {
  const variants = overrides.variants ?? [
    {
      id: 'variant-1',
      productId: 'product-1',
      name: '500g',
      sku: 'SKU-500G',
      price: 50,
      product: { id: 'product-1', name: 'Amul Milk', gstSlab: 'FIVE', taxInclusive: false, hsnCodeRef: { code: '0401', defaultGstSlab: 'FIVE' } },
    },
    {
      id: 'variant-2',
      productId: 'product-2',
      name: '1kg',
      sku: 'SKU-1KG',
      price: 100,
      product: { id: 'product-2', name: 'Amul Butter', gstSlab: 'TWELVE', taxInclusive: false, hsnCodeRef: { code: '0405', defaultGstSlab: 'TWELVE' } },
    },
  ];

  const resultFor = (variantId: string) =>
    overrides.recordOfflineSaleResults?.[variantId] ?? {
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
      findMany: jest.fn().mockResolvedValue(variants),
    },
    offlineBill: {
      create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'bill-1', createdAt: new Date(), ...data }),
      ),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  } as unknown as PrismaService;

  const merchantService = {
    requireMerchantProfile: jest.fn().mockResolvedValue({ id: 'profile-1' }),
  } as unknown as MerchantService;

  const inventoryService = {
    recordOfflineSale: jest.fn().mockImplementation((variantId: string) => Promise.resolve(resultFor(variantId))),
  } as unknown as InventoryService;

  const domainEvents = { emit: jest.fn().mockResolvedValue(undefined) } as unknown as DomainEventsService;
  const pdf = {} as never;
  const gstCalculator = {
    getRatesForSlab: jest.fn().mockResolvedValue({ cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, totalRate: 5 }),
    computeLine: jest.fn().mockReturnValue({
      taxableAmount: 0,
      cgstRate: 2.5,
      sgstRate: 2.5,
      igstRate: 5,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      lineTotal: 0,
    }),
  } as never;

  const service = new OfflineBillingService(prisma, merchantService, inventoryService, domainEvents, pdf, gstCalculator);

  return { service, prisma, merchantService, inventoryService, domainEvents };
}

const baseDto: CreateOfflineBillDto = {
  customerPhone: '9876543210',
  customerName: 'Ramesh',
  items: [
    { variantId: 'variant-1', quantity: 2 },
    { variantId: 'variant-2', quantity: 1 },
  ],
};

describe('OfflineBillingService.createBill', () => {
  it('decrements each line via InventoryService and persists a bill with the summed total', async () => {
    const { service, inventoryService, prisma } = buildHarness();

    const result = await service.createBill('user-1', 'store-1', baseDto, '1.2.3.4');

    expect(inventoryService.recordOfflineSale).toHaveBeenCalledTimes(2);
    expect(inventoryService.recordOfflineSale).toHaveBeenCalledWith('variant-1', 2, 'user-1', undefined, { ipAddress: '1.2.3.4' });
    expect(inventoryService.recordOfflineSale).toHaveBeenCalledWith('variant-2', 1, 'user-1', undefined, { ipAddress: '1.2.3.4' });

    // 500g @ 50 * 2 + 1kg @ 100 * 1 = 200
    expect((prisma.offlineBill.create as jest.Mock).mock.calls[0][0].data.totalAmount).toBe(200);
    expect(result.shortfallTotal).toBe(0);
  });

  it('aggregates shortfall across multiple lines instead of dropping it', async () => {
    const { service } = buildHarness({
      recordOfflineSaleResults: {
        'variant-1': { availableQty: 0, reservedQty: 0, soldQty: 0, status: 'OUT_OF_STOCK', shortfall: 3 },
        'variant-2': { availableQty: 0, reservedQty: 0, soldQty: 0, status: 'OUT_OF_STOCK', shortfall: 5 },
      },
    });

    const result = await service.createBill('user-1', 'store-1', baseDto);

    expect(result.shortfallTotal).toBe(8);
  });

  it('rejects when the store is not owned by the caller, without touching inventory', async () => {
    const { service, inventoryService } = buildHarness({ store: null });

    await expect(service.createBill('user-1', 'store-1', baseDto)).rejects.toThrow();
    expect(inventoryService.recordOfflineSale).not.toHaveBeenCalled();
  });

  it('rejects when an item does not belong to the store, without touching inventory', async () => {
    const { service, inventoryService } = buildHarness({
      variants: [
        { id: 'variant-1', productId: 'product-1', name: '500g', sku: 'SKU-500G', price: 50, product: { id: 'product-1', name: 'Amul Milk' } },
        // variant-2 missing — simulates it belonging to a different store
      ],
    });

    await expect(service.createBill('user-1', 'store-1', baseDto)).rejects.toThrow();
    expect(inventoryService.recordOfflineSale).not.toHaveBeenCalled();
  });

  it('rejects a bill with a duplicated variant instead of silently double-charging it', async () => {
    const { service, inventoryService } = buildHarness();
    const dupDto: CreateOfflineBillDto = {
      customerPhone: '9876543210',
      items: [
        { variantId: 'variant-1', quantity: 2 },
        { variantId: 'variant-1', quantity: 3 },
      ],
    };

    await expect(service.createBill('user-1', 'store-1', dupDto)).rejects.toThrow();
    expect(inventoryService.recordOfflineSale).not.toHaveBeenCalled();
  });
});
