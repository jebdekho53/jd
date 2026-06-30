import { test, expect } from '@playwright/test';
import { qaConfig } from './test-config';
import {
  assertNoUiCrash,
  attachProductionAudit,
  auditRoute,
  clickFirstVisible,
  login,
} from './helpers/production-audit';
import { appendToRunState, recordManualVerification } from './helpers/report-writer';

test.describe('Production Buyer audit', () => {
  test('buyer core navigation, cart, and read-only checkout audit', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    attachProductionAudit(page, 'buyer', testInfo);

    await auditRoute(page, 'buyer', qaConfig.buyerUrl, 'buyer homepage');
    await assertNoUiCrash(page, 'buyer');

    const locationOpened = await clickFirstVisible(page, [
      'button:has-text("Location")',
      'button:has-text("Deliver")',
      '[aria-label*="location" i]',
    ]);
    appendToRunState({
      appResults: [
        {
          app: 'buyer',
          status: 'PASS',
          notes: [`Location control ${locationOpened ? 'opened' : 'not present on current viewport'}`],
          timestamp: new Date().toISOString(),
        },
      ],
    });

    await auditRoute(page, 'buyer', `${qaConfig.buyerUrl}/stores`, 'buyer stores');
    await clickFirstVisible(page, ['a[href*="/store/"]', 'a[href*="/stores/"]']);
    await assertNoUiCrash(page, 'buyer');
    await auditRoute(page, 'buyer', page.url(), 'store detail');

    const productOpened = await clickFirstVisible(page, ['a[href*="/products/"]', 'a[href*="/product/"]']);
    if (productOpened) {
      await assertNoUiCrash(page, 'buyer');
      await auditRoute(page, 'buyer', page.url(), 'product detail');
      await clickFirstVisible(page, [
        'button:has-text("Add to cart")',
        'button:has-text("Add")',
        '[aria-label*="add to cart" i]',
      ]);
    }

    await auditRoute(page, 'buyer', `${qaConfig.buyerUrl}/cart`, 'buyer cart');
    await login(page, 'buyer').catch((error) => {
      appendToRunState({
        brokenNavigation: [
          {
            app: 'buyer',
            sourcePage: page.url(),
            clickedItem: 'buyer login',
            result: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          },
        ],
      });
    });

    await auditRoute(page, 'buyer', `${qaConfig.buyerUrl}/checkout`, 'buyer checkout read-only');
    recordManualVerification('buyer checkout', 'COD placement intentionally skipped unless a clearly safe QA/test order mode is present.');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
