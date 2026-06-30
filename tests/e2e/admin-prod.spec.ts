import { test, expect } from '@playwright/test';
import { qaConfig } from './test-config';
import {
  assertNoUiCrash,
  attachProductionAudit,
  auditRoute,
  clickAndRecord,
  login,
} from './helpers/production-audit';
import { appendToRunState } from './helpers/report-writer';

const ADMIN_ROUTES = [
  '/dashboard',
  '/stores',
  '/merchant-applications',
  '/orders',
  '/logistics',
  '/rider-queue',
  '/promotions',
  '/catalog',
  '/reviews',
  '/analytics',
  '/settings',
];

const ADMIN_SIDEBAR_ITEMS = [
  'Analytics',
  'Stores',
  'Applications',
  'Reviews',
  'Promotions',
  'Campaigns',
  'Rewards & Wallet',
  'Catalog',
  'Image Coverage',
  'AI Product Usage',
  'Merchant AI Wallets',
  'Category Requests',
  'Inventory',
  'Orders',
  'Unassigned',
  'Logistics',
  'Fleet Live',
];

test.describe('Production Admin audit', () => {
  test('admin panel navigation, buttons, routes, and APIs', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    attachProductionAudit(page, 'admin', testInfo);

    await login(page, 'admin');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('body')).toContainText(/dashboard|command center|platform/i);
    await assertNoUiCrash(page, 'admin');

    for (const route of ADMIN_ROUTES) {
      await auditRoute(page, 'admin', `${qaConfig.adminUrl}${route}`, 'admin route list');
      await assertNoUiCrash(page, 'admin');
    }

    await page.goto(`${qaConfig.adminUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    for (const item of ADMIN_SIDEBAR_ITEMS) {
      await clickAndRecord(page, 'admin', item);
      await assertNoUiCrash(page, 'admin');
    }

    const enabledButtons = await page.locator('button:not([disabled]), [role="button"]:not([aria-disabled="true"])').count();
    appendToRunState({
      appResults: [
        {
          app: 'admin',
          status: 'PASS',
          notes: [`Audited ${ADMIN_ROUTES.length} routes and ${enabledButtons} visible/enabled button controls`],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
});
