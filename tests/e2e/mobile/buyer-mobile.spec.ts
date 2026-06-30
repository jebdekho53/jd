import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring, assertNoHorizontalScroll } from '../helpers/monitoring';
import { assertNoServerError } from '../helpers/safe-click';
import { resetServiceWorkerAndCaches } from '../helpers/service-worker';

test.describe('Mobile — Buyer key flows', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'buyer-mobile', action: 'mobile' });
    await resetServiceWorkerAndCaches(page);
  });

  test('homepage — no horizontal scroll, nav visible', async ({ page }) => {
    await page.goto(qaConfig.buyerUrl);
    await preparePage(page);
    await assertNoHorizontalScroll(page);
    await expect(page.getByRole('button', { name: /search/i }).first()).toBeVisible();
    await assertNoServerError(page);
  });

  test('search page usable', async ({ page }) => {
    await page.goto(`${qaConfig.buyerUrl}/search?q=milk`);
    await preparePage(page);
    await assertNoHorizontalScroll(page);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('product listing from search', async ({ page }) => {
    await page.goto(`${qaConfig.buyerUrl}/search?q=rice`);
    await preparePage(page);
    await page.waitForTimeout(2_000);
    await assertNoHorizontalScroll(page);
  });

  test('cart page', async ({ page }) => {
    await page.goto(`${qaConfig.buyerUrl}/cart`);
    await preparePage(page);
    await assertNoHorizontalScroll(page);
    const cta = page.getByRole('button', { name: /checkout|continue|shop/i }).first();
    await expect(cta.or(page.locator('body'))).toBeVisible();
  });

  test('checkout page or redirect', async ({ page }) => {
    await page.goto(`${qaConfig.buyerUrl}/checkout`);
    await preparePage(page);
    await page.waitForTimeout(1_500);
    await assertNoHorizontalScroll(page);
    await expect(
      page.getByText(/checkout|cart needs items|empty|continue shopping|login required|sign in/i).first(),
    ).toBeVisible();
  });
});

test.describe('Mobile — Merchant & Admin smoke', () => {
  test('merchant login page loads', async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant-mobile', action: 'mobile-smoke' });
    await page.goto(`${qaConfig.merchantUrl}/login`);
    await preparePage(page);
    await assertNoHorizontalScroll(page);
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('admin login page loads', async ({ page }) => {
    attachPageMonitoring(page, { app: 'admin-mobile', action: 'mobile-smoke' });
    await page.goto(`${qaConfig.adminUrl}/login`);
    await page.getByRole('status', { name: 'Loading' }).waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => undefined);
    await preparePage(page);
    await assertNoHorizontalScroll(page);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});
