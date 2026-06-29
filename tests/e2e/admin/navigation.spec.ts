import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { safeClick, assertNoServerError } from '../helpers/safe-click';
import { addFinding } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.adminUrl, app: 'admin' });

const ADMIN_NAV = [
  'Overview',
  'Analytics',
  'Control Room',
  'Stores',
  'Applications',
  'Catalog',
  'Category Requests',
  'Orders',
  'Users',
  'Logistics',
  'Settlements',
  'Support Center',
  'Master Locations',
  'Security',
];

test.describe('Admin — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'admin', action: 'navigation' });
    await page.goto('/dashboard');
  });

  test('sidebar pages load', async ({ page }) => {
    for (const label of ADMIN_NAV) {
      const link = page.getByRole('link', { name: label, exact: true });
      if (!(await link.isVisible({ timeout: 3_000 }).catch(() => false))) continue;

      const clicked = await safeClick(link, {
        app: 'admin',
        sourcePage: page.url(),
        label,
      });
      if (!clicked) continue;

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);
      await assertNoServerError(page);
      addFinding('admin', `${label} → OK`);
    }
  });
});
