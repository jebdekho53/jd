import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { safeClick, assertNoServerError, dismissOverlays } from '../helpers/safe-click';
import { attachPageMonitoring } from '../helpers/monitoring';
import { resetServiceWorkerAndCaches } from '../helpers/service-worker';

async function safeGoto(page: import('@playwright/test').Page, url: string) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (err) {
    if (String(err).includes('NS_BINDING_ABORTED')) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return;
    }
    throw err;
  }
}

test.describe('Buyer — Public Homepage', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'buyer', action: 'homepage' });
    await resetServiceWorkerAndCaches(page);
  });

  test('loads homepage with header, search, cart, and profile', async ({ page }) => {
    await safeGoto(page, qaConfig.buyerUrl);
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
    await safeGoto(page, qaConfig.buyerUrl);
    await preparePage(page);

    const hrefs = await page
      .locator('header a[href], nav a[href]')
      .evaluateAll((links) =>
        links
          .map((link) => ({
            href: link.getAttribute('href') ?? '',
            label: (link.textContent ?? '').trim(),
          }))
          .filter((link) => link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')),
      );

    for (const { href, label } of hrefs.slice(0, 12)) {
      await safeGoto(page, qaConfig.buyerUrl);
      await dismissOverlays(page);
      const target = new URL(href, qaConfig.buyerUrl).toString();
      const clicked = await safeClick(page.locator(`a[href="${href}"]`).first(), {
        app: 'buyer',
        sourcePage: qaConfig.buyerUrl,
        label: label || href,
      });
      if (!clicked) await safeGoto(page, target);

      await page.waitForLoadState('domcontentloaded').catch(() => undefined);
      await assertNoServerError(page);
      const status = page.url();
      expect(status).not.toMatch(/404|500/);
    }
  });
});
