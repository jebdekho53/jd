import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { assertNoServerError } from '../helpers/safe-click';
import { addFinding } from '../helpers/report-writer';

test.describe('Buyer — Categories & Products', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'buyer', action: 'categories-products' });
  });

  test('browse categories and open product detail', async ({ page }) => {
    await page.goto(qaConfig.buyerUrl);
    await preparePage(page);

    const categoryLink = page
      .getByRole('link', { name: /grocery|food|electronics|fashion|pharmacy|category/i })
      .first();
    if (await categoryLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await categoryLink.click();
      await page.waitForLoadState('domcontentloaded');
      await assertNoServerError(page);
      addFinding('checkout', 'Category page loaded');
    }

    await page.goto(`${qaConfig.buyerUrl}/search?q=milk`);
    await preparePage(page);
    await page.waitForTimeout(2_500);

    const productLink = page
      .locator('a[href*="/product"], a[href*="/p/"], a[href*="/products/"]')
      .first();
    if (!(await productLink.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'No product links found for milk search' });
      return;
    }

    await productLink.click();
    await page.waitForLoadState('domcontentloaded');
    await assertNoServerError(page);

    const body = await page.locator('body').innerText();
    expect(body).toMatch(/₹|rs\.|price|add to cart|buy now/i);

    const hasImage = await page.locator('img').first().isVisible().catch(() => false);
    const hasAddToCart = await page
      .getByRole('button', { name: /add to cart|add/i })
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasImage || hasAddToCart).toBeTruthy();
  });
});
