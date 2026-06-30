import { test, expect } from '@playwright/test';
import { qaConfig } from './test-config';
import {
  assertNoUiCrash,
  attachProductionAudit,
  auditRoute,
  clickAndRecord,
  clickFirstVisible,
  login,
} from './helpers/production-audit';
import { appendToRunState } from './helpers/report-writer';

const MERCHANT_ROUTES = [
  '/dashboard',
  '/stores',
  '/products',
  '/inventory',
  '/orders',
  '/orders/live',
  '/earnings',
  '/finance',
  '/growth',
  '/reviews',
  '/support',
];

const MERCHANT_NAV_ITEMS = [
  'Dashboard',
  'Stores',
  'Products',
  'Inventory',
  'Orders',
  'Live Orders',
  'Earnings',
  'Finance',
  'Growth',
  'Reviews',
  'Support',
];

test.describe('Production Merchant audit', () => {
  test('merchant dashboard, orders, shipment panels, and navigation', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    attachProductionAudit(page, 'merchant', testInfo);

    await login(page, 'merchant');
    await expect(page).toHaveURL(/dashboard/);

    for (const route of MERCHANT_ROUTES) {
      await auditRoute(page, 'merchant', `${qaConfig.merchantUrl}${route}`, 'merchant route list');
      await assertNoUiCrash(page, 'merchant');
    }

    await auditRoute(page, 'merchant', `${qaConfig.merchantUrl}/orders`, 'merchant order list');
    const openedOrder = await clickFirstVisible(page, ['a[href*="/orders/"]:not([href$="/orders"])', 'tr a']);
    if (openedOrder) {
      await assertNoUiCrash(page, 'merchant');
      await auditRoute(page, 'merchant', page.url(), 'merchant order detail');
      await clickFirstVisible(page, [
        'button:has-text("Shipment")',
        'button:has-text("Tracking")',
        'a:has-text("Shipment")',
        'a:has-text("Tracking")',
      ]);
    }

    await page.goto(`${qaConfig.merchantUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    for (const item of MERCHANT_NAV_ITEMS) {
      await clickAndRecord(page, 'merchant', item);
      await assertNoUiCrash(page, 'merchant');
    }

    appendToRunState({
      appResults: [
        {
          app: 'merchant',
          status: 'PASS',
          notes: [`Audited ${MERCHANT_ROUTES.length} merchant routes and order detail if available`],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
});
