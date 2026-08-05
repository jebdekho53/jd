import { PrismaClient, SupportActorType, HelpArticleKind } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Franchise partner help-center articles. The KB table itself is shared across
 * all actor types (see seed-support-categories.ts for the ticket categories);
 * this just seeds the FRANCHISE-audience slice, which had zero articles before.
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
    slug: 'franchise-how-commission-works',
    title: 'How your commission share is calculated',
    body: 'Every 30-day settlement period, we sum the platform commission earned on orders from your linked, ACTIVE stores (GMV excludes cancelled orders). Your payout is that commission base multiplied by your commission percentage, minus 18% GST and 5% TDS (Section 194H) where applicable. Stores still PENDING_REVIEW earn nothing until an admin resolves the attribution.',
    kind: HelpArticleKind.GUIDE,
    category: 'FINANCE',
    sortOrder: 10,
  },
  {
    slug: 'franchise-territory-conflicts',
    title: 'What happens when two partners claim the same pincode',
    body: 'Pincodes are only exclusive if you enabled exclusivity on that territory. If another active partner also holds an exclusive claim on one of your pincodes, we open a territory conflict automatically and it appears on your Territory page under Conflicts. An admin reviews and resolves it — you do not need to do anything except respond if support reaches out.',
    kind: HelpArticleKind.FAQ,
    category: 'TERRITORY',
    sortOrder: 20,
  },
  {
    slug: 'franchise-store-attribution',
    title: 'Why a recruited store shows Pending Review',
    body: 'A store you refer is attributed to you as PENDING_REVIEW if it lands in a pincode with a conflicting exclusive claim, or needs manual verification. It will not count toward your GMV or earnings until an admin approves it. If it stays pending for more than a few days, raise a Store attribution ticket from the Support page.',
    kind: HelpArticleKind.FAQ,
    category: 'STORES',
    sortOrder: 30,
  },
  {
    slug: 'franchise-referral-link',
    title: 'Using your referral link to recruit merchants',
    body: 'Your referral link (shown on the Dashboard) permanently attributes any merchant who signs up through it to your franchise. Track application status on the Growth page — applications move from Submitted through Under review and KYC pending to Approved. Only approved, active stores earn you commission.',
    kind: HelpArticleKind.GUIDE,
    category: 'RECRUITMENT',
    sortOrder: 40,
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
        audience: SupportActorType.FRANCHISE,
        sortOrder: a.sortOrder,
        isPublished: true,
      },
      create: {
        slug: a.slug,
        title: a.title,
        body: a.body,
        kind: a.kind,
        category: a.category,
        audience: SupportActorType.FRANCHISE,
        sortOrder: a.sortOrder,
        isPublished: true,
      },
    });
  }
  const count = await prisma.helpArticle.count({ where: { audience: SupportActorType.FRANCHISE } });
  console.log(`Seeded franchise help articles. Total: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
