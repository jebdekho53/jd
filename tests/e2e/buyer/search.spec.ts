import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { SEARCH_QUERIES, qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { assertNoServerError } from '../helpers/safe-click';

test.describe('Buyer — Search', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'buyer', action: 'search' });
  });

  for (const query of SEARCH_QUERIES) {
    test(`search: "${query.slice(0, 30)}${query.length > 30 ? '…' : ''}"`, async ({ page }) => {
      await page.goto(`${qaConfig.buyerUrl}/search?q=${encodeURIComponent(query)}`);
      await preparePage(page);
      await page.waitForTimeout(2_000);

      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(50);

      const hasResults = /result|product|store|add to cart|no results|nothing found|couldn't find/i.test(body);
      const hasContent = await page.locator('main, [role="main"], .container, article').first().isVisible().catch(() => true);
      expect(hasResults || hasContent).toBeTruthy();

      await assertNoServerError(page);
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }

  test('search page via header button', async ({ page }) => {
    await page.goto(qaConfig.buyerUrl);
    await preparePage(page);
    await page.getByRole('button', { name: /search products/i }).first().click();
    await expect(page).toHaveURL(/\/search/);
    await page.getByRole('searchbox').or(page.getByPlaceholder(/search/i)).first().fill('milk');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2_000);
    await assertNoServerError(page);
  });
});
