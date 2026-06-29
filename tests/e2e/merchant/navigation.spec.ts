import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { safeClick, assertNoServerError } from '../helpers/safe-click';
import { addFinding } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.merchantUrl, app: 'merchant' });

const MERCHANT_NAV = [
  'Dashboard',
  'My Stores',
  'Delivery Coverage',
  'Categories',
  'Products',
  'Inventory',
  'Orders',
  'Live Orders',
  'Returns & Claims',
  'Reviews',
  'Promotions',
  'Earnings',
  'Finance',
  'GST & Tax',
  'Support',
  'Customers',
];

test.describe('Merchant — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'navigation' });
    await page.goto('/dashboard');
  });

  test('sidebar pages load without errors', async ({ page }) => {
    for (const label of MERCHANT_NAV) {
      const link = page.getByRole('link', { name: label, exact: true });
      if (!(await link.isVisible({ timeout: 3_000 }).catch(() => false))) {
        addFinding('merchant', `Nav item not visible: ${label}`);
        continue;
      }

      const before = page.url();
      const clicked = await safeClick(link, {
        app: 'merchant',
        sourcePage: before,
        label,
      });
      if (!clicked) continue;

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1_000);
      await assertNoServerError(page);
      addFinding('merchant', `${label} → ${page.url()}`);
    }
  });
});
