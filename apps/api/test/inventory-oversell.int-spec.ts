/**
 * Integration test — inventory oversell guard, against a REAL Postgres.
 *
 * This exercises the exact atomic UPDATE that InventoryService.reserveForCheckout
 * runs. The invariant: two buyers racing for the last unit must NOT both succeed.
 * A pure unit test cannot prove this — it needs the database's own row locking.
 *
 * Run against a DISPOSABLE test database only:
 *   TEST_DATABASE_URL=postgresql://.../jebdekho_test \
 *     pnpm --filter @jebdekho/api test:integration
 *
 * If TEST_DATABASE_URL is unset the suite skips (so CI without a DB stays green).
 */
import { PrismaClient } from '@prisma/client';

const url = process.env.TEST_DATABASE_URL;
const describeIf = url ? describe : describe.skip;

describeIf('inventory oversell guard (real Postgres)', () => {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const ids: Record<string, string> = {};

  // The production reserve UPDATE, verbatim.
  const reserve = (variantId: string, qty: number) =>
    prisma.$executeRaw`
      UPDATE inventory
      SET quantity = quantity - ${qty},
          reserved = reserved + ${qty},
          version = version + 1,
          status = CASE
            WHEN (quantity - ${qty}) <= 0 THEN 'OUT_OF_STOCK'::"InventoryStatus"
            ELSE status
          END
      WHERE variant_id = ${variantId}
        AND status = 'ACTIVE'::"InventoryStatus"
        AND quantity >= ${qty}
    `;

  const restock = (variantId: string, qty: number) =>
    prisma.$executeRaw`
      UPDATE inventory
      SET quantity = quantity + ${qty},
          reserved = GREATEST(0, reserved - ${qty}),
          version = version + 1,
          status = CASE
            WHEN (quantity + ${qty}) > 0 THEN 'ACTIVE'::"InventoryStatus"
            ELSE 'OUT_OF_STOCK'::"InventoryStatus"
          END
      WHERE variant_id = ${variantId}
    `;

  const readInv = (variantId: string) =>
    prisma.inventory.findUnique({
      where: { variantId },
      select: { availableQty: true, reservedQty: true, status: true },
    });

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { phone: '+919999000001' } });
    const merchant = await prisma.merchantProfile.create({
      data: { userId: user.id, businessName: 'Test Kirana' },
    });
    const city = await prisma.city.create({
      data: { name: 'Testville', slug: `testville-${Date.now()}`, state: 'Delhi', latitude: 28.61, longitude: 77.23 },
    });
    const store = await prisma.store.create({
      data: {
        merchantProfileId: merchant.id,
        cityId: city.id,
        name: 'Test Store',
        slug: `test-store-${Date.now()}`,
        line1: '1 Test Rd',
        pincode: '110001',
        latitude: 28.61,
        longitude: 77.23,
      },
    });
    const product = await prisma.product.create({
      data: { storeId: store.id, name: 'Test Atta', slug: `test-atta-${Date.now()}`, basePrice: 50 },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `SKU-${Date.now()}`, name: '1kg', price: 50 },
    });
    await prisma.inventory.create({ data: { variantId: variant.id, availableQty: 1 } });

    Object.assign(ids, {
      userId: user.id,
      cityId: city.id,
      storeId: store.id,
      productId: product.id,
      variantId: variant.id,
    });
  });

  afterAll(async () => {
    // Cascades from user (merchant) and product (variant → inventory) clean the rest.
    if (ids.productId) await prisma.product.deleteMany({ where: { id: ids.productId } });
    if (ids.storeId) await prisma.store.deleteMany({ where: { id: ids.storeId } });
    if (ids.userId) await prisma.user.deleteMany({ where: { id: ids.userId } });
    if (ids.cityId) await prisma.city.deleteMany({ where: { id: ids.cityId } });
    await prisma.$disconnect();
  });

  it('lets exactly one buyer reserve the last unit, not two', async () => {
    const first = await reserve(ids.variantId, 1);
    expect(first).toBe(1); // one row updated

    const second = await reserve(ids.variantId, 1);
    expect(second).toBe(0); // guard blocks the oversell — no rows updated

    const inv = await readInv(ids.variantId);
    expect(inv?.availableQty).toBe(0);
    expect(inv?.reservedQty).toBe(1);
    expect(inv?.status).toBe('OUT_OF_STOCK');
  });

  it('refuses a reservation larger than available stock', async () => {
    await restock(ids.variantId, 1); // back to 1 available, ACTIVE
    const tooMany = await reserve(ids.variantId, 5);
    expect(tooMany).toBe(0);
    const inv = await readInv(ids.variantId);
    expect(inv?.availableQty).toBe(1); // untouched
  });

  it('restock re-activates an out-of-stock variant', async () => {
    await reserve(ids.variantId, 1); // drain → OUT_OF_STOCK
    let inv = await readInv(ids.variantId);
    expect(inv?.status).toBe('OUT_OF_STOCK');

    await restock(ids.variantId, 3);
    inv = await readInv(ids.variantId);
    expect(inv?.availableQty).toBe(3);
    expect(inv?.status).toBe('ACTIVE');
  });
});
