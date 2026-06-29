import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { assertNoServerError } from '../helpers/safe-click';
import { addFinding } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.merchantUrl, app: 'merchant' });

const PAGES = ['Promotions', 'Earnings', 'Finance', 'Support', 'Growth', 'AI Commerce'];

test.describe('Merchant — Offers, Reports & Settings', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'offers-settings' });
    await page.goto('/dashboard');
  });

  for (const label of PAGES) {
    test(`${label} page loads`, async ({ page }) => {
      const link = page.getByRole('link', { name: label, exact: true });
      if (!(await link.isVisible({ timeout: 5_000 }).catch(() => false))) {
        test.skip(true, `${label} not in sidebar`);
        return;
      }
      await link.click();
      await page.waitForLoadState('domcontentloaded');
      await assertNoServerError(page);
      addFinding('merchant', `${label} page OK`);
    });
  }
});
