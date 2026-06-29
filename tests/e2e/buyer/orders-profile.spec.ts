import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { loginAsBuyer, logoutBuyer, clearAuthState } from '../helpers/auth';
import { assertLoginRequired } from '../helpers/rbac';

test.describe('Buyer — Orders & Profile', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'buyer', action: 'orders-profile' });
  });

  test('protected routes redirect when logged out', async ({ page, context }) => {
    await clearAuthState(context);
    await page.goto(`${qaConfig.buyerUrl}/orders`);
    await page.waitForTimeout(2_000);
    await assertLoginRequired(page);

    await page.goto(`${qaConfig.buyerUrl}/profile`);
    await page.waitForTimeout(2_000);
    const url = page.url();
    const onLogin = url.includes('/login');
    const onProfile = url.includes('/profile');
    expect(onLogin || onProfile).toBeTruthy();
  });

  test('login, view orders/profile, logout', async ({ page, context }) => {
    await clearAuthState(context);
    await loginAsBuyer(page);

    await page.goto(`${qaConfig.buyerUrl}/orders`);
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();
    const ordersBody = await page.locator('body').innerText();
    expect(ordersBody).toMatch(/order|no orders|history|my orders/i);

    await page.goto(`${qaConfig.buyerUrl}/profile`);
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();

    await logoutBuyer(page);
    await clearAuthState(context);

    await page.goto(`${qaConfig.buyerUrl}/orders`);
    await page.waitForTimeout(2_000);
    await assertLoginRequired(page);
  });
});
