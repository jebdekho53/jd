import { PrismaClient, SupportActorType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Support ticket categories. `code` is the stable key referenced by ticket
 * creation, auto-tagging and team routing (see ticket-assignment.service.ts).
 * `audience` scopes which portal surfaces the category. Idempotent — safe to
 * re-run.
 */
const CATEGORIES: {
  code: string;
  name: string;
  audience: SupportActorType;
  description: string;
  sortOrder: number;
}[] = [
  // Buyer
  { code: 'ORDER_DISPUTE', name: 'Order issue', audience: SupportActorType.BUYER, description: 'Wrong, missing, damaged, or incorrect items', sortOrder: 10 },
  { code: 'DELIVERY_PROBLEM', name: 'Delivery problem', audience: SupportActorType.BUYER, description: 'Late, undelivered, or delivery experience issues', sortOrder: 20 },
  { code: 'REFUND_ISSUE', name: 'Refund / return', audience: SupportActorType.BUYER, description: 'Refund not received or return request help', sortOrder: 30 },
  { code: 'PAYMENT_PROBLEM', name: 'Payment issue', audience: SupportActorType.BUYER, description: 'Failed payment, double charge, or wallet issue', sortOrder: 40 },
  { code: 'PRODUCT_QUALITY', name: 'Product quality', audience: SupportActorType.BUYER, description: 'Quality, freshness, or expiry concerns', sortOrder: 50 },
  { code: 'GENERAL', name: 'General query', audience: SupportActorType.BUYER, description: 'Anything else', sortOrder: 60 },

  // Merchant
  { code: 'SETTLEMENT_ISSUE', name: 'Settlement issue', audience: SupportActorType.MERCHANT, description: 'Settlement amount or reconciliation', sortOrder: 10 },
  { code: 'PAYOUT_DELAY', name: 'Payout delay', audience: SupportActorType.MERCHANT, description: 'Payout not received on time', sortOrder: 20 },
  { code: 'INVENTORY_ISSUE', name: 'Inventory / catalog', audience: SupportActorType.MERCHANT, description: 'Stock, product, or catalog problems', sortOrder: 30 },
  { code: 'STORE_VERIFICATION', name: 'Store verification', audience: SupportActorType.MERCHANT, description: 'KYC / store document verification', sortOrder: 40 },
  { code: 'CAMPAIGN_PROBLEM', name: 'Ads / campaigns', audience: SupportActorType.MERCHANT, description: 'Promotions, ads, or campaign issues', sortOrder: 50 },
  { code: 'GST_ISSUE', name: 'GST / tax', audience: SupportActorType.MERCHANT, description: 'GST, invoicing, or tax compliance', sortOrder: 60 },
  { code: 'COD_MISMATCH', name: 'COD mismatch', audience: SupportActorType.MERCHANT, description: 'Cash-on-delivery reconciliation mismatch', sortOrder: 70 },

  // Rider
  { code: 'RIDER_EARNINGS', name: 'Earnings', audience: SupportActorType.RIDER, description: 'Earnings, incentives, or payout queries', sortOrder: 10 },
  { code: 'DELIVERY_DISPUTE', name: 'Delivery dispute', audience: SupportActorType.RIDER, description: 'Order pickup / delivery disputes', sortOrder: 20 },
  { code: 'APP_ISSUE', name: 'App issue', audience: SupportActorType.RIDER, description: 'Rider app bugs or technical problems', sortOrder: 30 },
  { code: 'RIDER_ACCOUNT', name: 'Account', audience: SupportActorType.RIDER, description: 'Account access or profile issues', sortOrder: 40 },
  { code: 'RIDER_KYC', name: 'KYC / documents', audience: SupportActorType.RIDER, description: 'Onboarding or document verification', sortOrder: 50 },
];

async function main() {
  for (const c of CATEGORIES) {
    await prisma.supportCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, audience: c.audience, description: c.description, sortOrder: c.sortOrder, isActive: true },
      create: { ...c, isActive: true },
    });
  }
  const count = await prisma.supportCategory.count();
  console.log(`Seeded support categories. Total: ${count}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
