import { PrismaClient, SupportActorType, HelpArticleKind } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Merchant help-center articles, one per SupportCategory the merchant portal
 * exposes (see seed-support-categories.ts). Feeds the KB-deflection search on
 * the merchant support ticket form — had only 1 article before this.
 */
const ARTICLES: {
  slug: string;
  title: string;
  body: string;
  kind: HelpArticleKind;
  category: string;
  sortOrder: number;
}[] = [
  {
    slug: 'merchant-onboarding-steps',
    title: 'What you need to finish onboarding',
    body: 'You need a verified store address, at least one bank account for payouts, GST details (or a declared exemption), and your first product listed before your store can go live. Same-day delivery stores also need Shadowfax serviceability confirmed for their pincode. Check your Dashboard for a checklist of anything still pending.',
    kind: HelpArticleKind.GUIDE,
    category: 'MERCHANT_ONBOARDING',
    sortOrder: 10,
  },
  {
    slug: 'merchant-settlement',
    title: 'When do merchants get paid?',
    body: 'Settlements run on a rolling cycle based on delivered orders, net of commission, GST, and any refund clawbacks. You can see the exact breakdown for each settlement, including line-item deductions, on the Payouts page. If a settlement looks short, check the GST and Credit/Debit Notes tabs first — most mismatches trace back to an unreconciled offline bill or claim refund.',
    kind: HelpArticleKind.FAQ,
    category: 'SETTLEMENT_ISSUE',
    sortOrder: 20,
  },
  {
    slug: 'merchant-payout-delay',
    title: 'Why a payout is delayed',
    body: 'Payouts pause automatically if your bank account fails verification, if there is an unresolved wallet/fraud review flag on your store, or if the settlement is still within its hold window. Check the Bank Account page for a verification status first — an unverified account is the most common cause. If everything looks correct and a payout is still stuck past its expected date, raise a ticket with the settlement ID.',
    kind: HelpArticleKind.FAQ,
    category: 'PAYOUT_DELAY',
    sortOrder: 30,
  },
  {
    slug: 'merchant-inventory-sync',
    title: 'Fixing inventory and catalog issues',
    body: 'Out-of-stock items are hidden from buyers automatically once quantity hits zero — you do not need to manually deactivate them. If a product is showing the wrong price, image, or variant, edit it directly from the Catalog page; changes apply within a minute. Bulk catalog issues (many products wrong at once) are usually a bad CSV import — re-check the upload template before re-uploading.',
    kind: HelpArticleKind.GUIDE,
    category: 'INVENTORY_ISSUE',
    sortOrder: 40,
  },
  {
    slug: 'merchant-store-verification',
    title: 'Store verification taking too long',
    body: 'Store verification checks your submitted address, documents, and (for same-day delivery) courier serviceability. Most stores clear within 1-2 business days. If your documents were rejected, the reason is shown on your Dashboard verification card — fix and resubmit rather than opening a new application. If it has been pending more than 3 days with no reason shown, raise a ticket.',
    kind: HelpArticleKind.FAQ,
    category: 'STORE_VERIFICATION',
    sortOrder: 50,
  },
  {
    slug: 'merchant-campaign-issues',
    title: 'Ads and campaign troubleshooting',
    body: 'Promoted listings and campaigns need an active budget and at least one eligible product to start serving impressions. If a campaign shows zero impressions after a few hours, check that its budget has not already been exhausted and that the linked products are in stock. Campaign spend is deducted from your wallet balance, not your settlement — top up your wallet if a campaign paused for insufficient funds.',
    kind: HelpArticleKind.FAQ,
    category: 'CAMPAIGN_PROBLEM',
    sortOrder: 60,
  },
  {
    slug: 'merchant-gst-tax',
    title: 'GST invoices and tax documents',
    body: 'GST-compliant invoices for every order, plus any Credit/Debit Notes issued against refunds or claims, are available on your GST page along with a downloadable PDF per invoice. Offline bills you record in-store are merged into the same GST dashboard automatically, so your tax reporting covers both online and offline sales in one place.',
    kind: HelpArticleKind.GUIDE,
    category: 'GST_ISSUE',
    sortOrder: 70,
  },
  {
    slug: 'merchant-cod-mismatch',
    title: 'COD collection not matching your settlement',
    body: 'Cash-on-delivery amounts collected by the rider are remitted to you separately from your online-order settlement, on their own schedule. If the COD total looks short, check whether any of those orders were later cancelled, returned, or had a partial refund claim approved — those get deducted from the next remittance rather than reversing the earlier one line-by-line.',
    kind: HelpArticleKind.FAQ,
    category: 'COD_MISMATCH',
    sortOrder: 80,
  },
];

async function main() {
  for (const a of ARTICLES) {
    await prisma.helpArticle.upsert({
      where: { slug: a.slug },
      update: {
        title: a.title,
        body: a.body,
        kind: a.kind,
        category: a.category,
        audience: SupportActorType.MERCHANT,
        sortOrder: a.sortOrder,
        isPublished: true,
      },
      create: {
        slug: a.slug,
        title: a.title,
        body: a.body,
        kind: a.kind,
        category: a.category,
        audience: SupportActorType.MERCHANT,
        sortOrder: a.sortOrder,
        isPublished: true,
      },
    });
  }
  const count = await prisma.helpArticle.count({ where: { audience: SupportActorType.MERCHANT } });
  console.log(`Seeded merchant help articles. Total: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
