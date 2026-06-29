import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { assertNoServerError } from '../helpers/safe-click';
import { addFinding } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.adminUrl, app: 'admin' });

test.describe('Admin — Users, Orders, Reports', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'admin', action: 'users-orders' });
    await page.goto('/dashboard');
  });

  test('users page with search/filter', async ({ page }) => {
    await page.goto('/users');
    await preparePage(page);
    await assertNoServerError(page);

    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await search.fill('test');
      await page.waitForTimeout(1_000);
    }
    addFinding('admin', 'Users page loaded');
  });

  test('orders page loads', async ({ page }) => {
    await page.goto('/orders');
    await preparePage(page);
    await assertNoServerError(page);
    addFinding('admin', 'Orders page loaded');
  });

  test('analytics and monitoring', async ({ page }) => {
    for (const path of ['/analytics', '/monitoring', '/finance']) {
      await page.goto(path);
      await preparePage(page);
      const body = await page.locator('body').innerText();
      expect(body).not.toMatch(/stack trace|internal server error/i);
      addFinding('admin', `${path} loaded`);
    }
  });
});
