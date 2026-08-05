import { PrismaClient, SupportActorType, HelpArticleKind } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Rider help-center articles, one per SupportCategory the rider portal
 * exposes (see seed-support-categories.ts). Feeds the KB-deflection search on
 * the rider support ticket form — had only 1 article before this.
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
    slug: 'rider-earnings-breakdown',
    title: 'How your earnings are calculated',
    body: 'Each delivery pays a base fare plus distance and surge components, shown per-order on your Earnings tab. Incentives and referral bonuses are credited separately and labelled in the same list. Earnings for a delivery post once the order is marked delivered — cancelled or reassigned deliveries do not earn the base fare unless you had already picked up the order.',
    kind: HelpArticleKind.GUIDE,
    category: 'RIDER_EARNINGS',
    sortOrder: 10,
  },
  {
    slug: 'rider-cod-remittance',
    title: 'COD remittance guide',
    body: 'Cash you collect on COD deliveries is tracked against your remittance balance and settled on a fixed schedule, not instantly. Check your Earnings tab for your current outstanding COD balance. If a remittance total looks wrong, it is usually because a delivery was double-counted or missed in the split across multiple riders on the same route — raise a ticket with the order ID if the balance does not match after your next scheduled remittance.',
    kind: HelpArticleKind.FAQ,
    category: 'DELIVERY_DISPUTE',
    sortOrder: 20,
  },
  {
    slug: 'rider-delivery-dispute',
    title: 'Disputing a delivery issue',
    body: 'If a buyer or merchant reported a problem with a delivery you completed (wrong address, missing items, damaged package), your best evidence is your delivery-completion photo and the timestamped status history on that order. Raise a ticket referencing the order ID and we will review the full timeline before any earnings or rating are affected.',
    kind: HelpArticleKind.FAQ,
    category: 'DELIVERY_DISPUTE',
    sortOrder: 30,
  },
  {
    slug: 'rider-app-issues',
    title: 'App not showing offers or getting stuck',
    body: 'If you are online but not receiving delivery offers, check that location permissions are still granted and that you are inside an active service zone. Offers expire automatically after a short countdown if not accepted — a slow or dropped connection can cause you to miss them, not a platform restriction. Force-closing and reopening the app resolves most stuck screens; if the issue persists, raise a ticket with your device model.',
    kind: HelpArticleKind.FAQ,
    category: 'APP_ISSUE',
    sortOrder: 40,
  },
  {
    slug: 'rider-account-status',
    title: 'Account suspended or restricted',
    body: 'A suspended or restricted account shows the reason directly in the app under Account status. Most restrictions are tied to a pending KYC document, a rating drop below the platform threshold, or a flagged delivery dispute under review. Resolving the underlying item (re-submitting a document, waiting out a review) lifts the restriction automatically — you do not need to reapply from scratch.',
    kind: HelpArticleKind.FAQ,
    category: 'RIDER_ACCOUNT',
    sortOrder: 50,
  },
  {
    slug: 'rider-kyc-documents',
    title: 'KYC document requirements and rejections',
    body: 'You need a valid driving license, vehicle registration (for motorized vehicles), and a bank account for payouts, all uploaded from the Account tab. A rejected document shows the specific reason (blurry scan, mismatched name, expired) right on the KYC card — fix that specific issue and reupload rather than submitting a new document type. Bank-account changes require step-up OTP verification for security.',
    kind: HelpArticleKind.GUIDE,
    category: 'RIDER_KYC',
    sortOrder: 60,
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
        audience: SupportActorType.RIDER,
        sortOrder: a.sortOrder,
        isPublished: true,
      },
      create: {
        slug: a.slug,
        title: a.title,
        body: a.body,
        kind: a.kind,
        category: a.category,
        audience: SupportActorType.RIDER,
        sortOrder: a.sortOrder,
        isPublished: true,
      },
    });
  }
  const count = await prisma.helpArticle.count({ where: { audience: SupportActorType.RIDER } });
  console.log(`Seeded rider help articles. Total: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
