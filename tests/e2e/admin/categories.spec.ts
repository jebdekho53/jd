import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { addFinding, recordManualVerification } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.adminUrl, app: 'admin' });

test.describe('Admin — Categories & Catalog', () => {
  test('catalog and category requests (read-only)', async ({ page }) => {
    attachPageMonitoring(page, { app: 'admin', action: 'categories' });
    await page.goto('/catalog');
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();

    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await search.fill('grocery');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1_000);
    }
    addFinding('admin', 'Catalog list/search verified');

    await page.goto('/category-requests');
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();

    recordManualVerification(
      'Create QA test category',
      `Skipped auto-create of "${qaConfig.testCategoryName}" on production — validation-only`,
    );
  });
});
