/**
 * End-to-end proof of the franchise acquisition loop, run against the REAL production
 * schema with the REAL service code — inside a transaction that is always rolled back,
 * so production keeps not a single new row.
 *
 * Covers the bug that was just fixed: a store approved from the ADMIN STORE QUEUE
 * (rather than by approving its merchant application) used to drop the franchise
 * referral on the floor — no FranchiseStore link, and the partner who recruited the
 * merchant went unpaid.
 *
 *   pnpm exec tsx scripts/qa-franchise-e2e.ts
 */
import { PrismaClient, Prisma, StoreStatus, MerchantApplicationStatus } from '@prisma/client';
import { FranchiseStoreLinkService } from '../apps/api/src/modules/franchise/franchise-store-link.service';

const prisma = new PrismaClient();
const ok = (b: boolean) => (b ? '✅' : '❌');
let failures = 0;
function check(label: string, pass: boolean, detail = '') {
  if (!pass) failures++;
  console.log(`  ${ok(pass)} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  const city = await prisma.city.findFirstOrThrow({ select: { id: true } });

  await prisma
    .$transaction(async (tx) => {
      // The service depends on nothing but Prisma, so it runs happily on the tx client
      // — meaning this exercises the exact code that runs in production.
      const svc = new FranchiseStoreLinkService(tx as never);

      // ── 1. A brand-new QA franchise partner ────────────────────────────────
      const frUser = await tx.user.create({
        data: { phone: '+919000000001', email: 'qa.franchise@example.test' },
      });
      const partner = await tx.franchisePartner.create({
        data: {
          userId: frUser.id,
          businessName: 'QA Franchise Pvt Ltd',
          referralCode: 'FR-QAX-01',
          status: 'ACTIVE',
          // commissionPercent defaults to 10 = 10% OF PLATFORM COMMISSION
        },
      });
      await tx.franchiseTerritory.create({
        data: {
          franchiseId: partner.id,
          city: 'Ghaziabad',
          state: 'Uttar Pradesh',
          pincodes: ['201017'],
          exclusivityEnabled: true,
        },
      });
      console.log(`\n1. QA franchise: ${partner.businessName} (${partner.referralCode}) @ ${partner.commissionPercent}%`);
      check('partner is ACTIVE with a referral code', partner.status === 'ACTIVE' && !!partner.referralCode);
      check('commission is 10% (of platform commission, not GMV)', Number(partner.commissionPercent) === 10);

      // ── 2. A QA merchant signs up THROUGH the referral link ────────────────
      const mUser = await tx.user.create({ data: { phone: '+919000000002' } });
      const profile = await tx.merchantProfile.create({
        data: { userId: mUser.id, businessName: 'QA Kirana Store' },
      });
      const store = await tx.store.create({
        data: {
          merchantProfileId: profile.id,
          cityId: city.id,
          name: 'QA Kirana Store',
          slug: `qa-kirana-${Date.now()}`,
          line1: 'QA Street',
          pincode: '201017',
          latitude: 28.67,
          longitude: 77.45,
          status: StoreStatus.PENDING_REVIEW,
        },
      });
      // This is what merchant-web's ?ref= capture writes onto the application.
      const app = await tx.merchantApplication.create({
        data: {
          userId: mUser.id,
          storeId: store.id,
          businessName: 'QA Kirana Store',
          status: MerchantApplicationStatus.SUBMITTED,
          franchiseId: partner.id,
          referralCode: partner.referralCode,
        },
      });
      console.log(`\n2. QA merchant signed up via ?ref=${partner.referralCode}`);
      check('application captured the referral', app.franchiseId === partner.id);
      check('store starts UNattributed (link only happens on approval)', store.franchiseId === null);

      // ── 3. Admin approves the store FROM THE STORE QUEUE (the bug path) ────
      await tx.store.update({
        where: { id: store.id },
        data: { status: StoreStatus.APPROVED, isActive: true },
      });
      // ...which is exactly where AdminStoreService now calls this:
      await svc.attributeStoreFromApplication(store.id, 'qa-admin');

      const linkedStore = await tx.store.findUniqueOrThrow({ where: { id: store.id } });
      const link = await tx.franchiseStore.findFirst({
        where: { storeId: store.id },
        select: { status: true, franchiseId: true, conflictReason: true },
      });

      console.log('\n3. Admin approved via the STORE QUEUE (the path that used to drop the referral)');
      check('store carries the franchise', linkedStore.franchiseId === partner.id);
      check('store carries the referral code', linkedStore.referralCode === partner.referralCode);
      check('FranchiseStore link EXISTS', !!link, link ? '' : 'THIS WAS THE BUG');
      check('link is ACTIVE (so it settles)', link?.status === 'ACTIVE');
      check('no false conflict', link?.conflictReason === null);

      // ── 4. Exclusivity guard still bites ──────────────────────────────────
      // A store in 110001 — NCR Franchise Partners' exclusive turf — claimed by our QA
      // partner must be parked, not silently double-attributed.
      const store2 = await tx.store.create({
        data: {
          merchantProfileId: profile.id,
          cityId: city.id,
          name: 'QA Delhi Store',
          slug: `qa-delhi-${Date.now()}`,
          line1: 'Delhi Street',
          pincode: '110001',
          latitude: 28.63,
          longitude: 77.21,
          status: StoreStatus.PENDING_REVIEW,
        },
      });
      await tx.merchantApplication.create({
        data: {
          userId: mUser.id,
          storeId: store2.id,
          businessName: 'QA Delhi Store',
          status: MerchantApplicationStatus.SUBMITTED,
          franchiseId: partner.id,
          referralCode: partner.referralCode,
        },
      });
      await svc.attributeStoreFromApplication(store2.id, 'qa-admin');
      const link2 = await tx.franchiseStore.findFirst({
        where: { storeId: store2.id },
        select: { status: true, conflictReason: true },
      });
      console.log("\n4. QA partner claims a store inside another partner's exclusive pincode (110001)");
      check('link is PARKED as PENDING_REVIEW', link2?.status === 'PENDING_REVIEW');
      check('conflict reason recorded', !!link2?.conflictReason, link2?.conflictReason ?? '');

      // ── 5. Settlement only counts ACTIVE links ────────────────────────────
      const settleable = await tx.franchiseStore.count({
        where: { franchiseId: partner.id, status: 'ACTIVE' },
      });
      console.log('\n5. What settlement would actually pay on');
      check('exactly 1 of the 2 links settles (parked one excluded)', settleable === 1, `${settleable} of 2`);

      throw new Error('__ROLLBACK__');
    })
    .catch((e) => {
      if (!(e instanceof Error) || e.message !== '__ROLLBACK__') throw e;
    });

  // ── Prove production is untouched ────────────────────────────────────────
  const [partners, links, stores, users] = await Promise.all([
    prisma.franchisePartner.count(),
    prisma.franchiseStore.count(),
    prisma.store.count(),
    prisma.user.count(),
  ]);
  console.log('\n--- ROLLED BACK ---');
  console.log(`production after: partners=${partners} links=${links} stores=${stores} users=${users}`);
  console.log(failures === 0 ? '\n🎉 ALL CHECKS PASSED\n' : `\n❌ ${failures} CHECK(S) FAILED\n`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
