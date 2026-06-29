import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { safeClick, assertNoServerError, dismissOverlays } from '../helpers/safe-click';
import { attachPageMonitoring } from '../helpers/monitoring';

test.describe('Buyer — Public Homepage', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'buyer', action: 'homepage' });
  });

  test('loads homepage with header, search, cart, and profile', async ({ page }) => {
    await page.goto(qaConfig.buyerUrl);
    await preparePage(page);
    await expect(page).toHaveTitle(/jebdekho|compare prices|save more/i);

    await expect(page.getByRole('link', { name: /jebdekho/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /search products/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /grocery cart/i }).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /profile|login|account/i }).first(),
    ).toBeVisible();

    await assertNoServerError(page);
  });

  test('nav links load without 404/500', async ({ page }) => {
    await page.goto(qaConfig.buyerUrl);
    await preparePage(page);

    const navLinks = page.locator('header a[href], nav a[href]').filter({ hasText: /.+/ });
    const count = Math.min(await navLinks.count(), 12);

    for (let i = 0; i < count; i++) {
      await page.goto(qaConfig.buyerUrl);
      await dismissOverlays(page);
      const link = navLinks.nth(i);
      const label = (await link.innerText()).trim() || (await link.getAttribute('href')) || `link-${i}`;
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      const clicked = await safeClick(link, {
        app: 'buyer',
        sourcePage: qaConfig.buyerUrl,
        label,
      });
      if (!clicked) continue;

      await page.waitForLoadState('domcontentloaded');
      await assertNoServerError(page);
      const status = page.url();
      expect(status).not.toMatch(/404|500/);
    }
  });
});
