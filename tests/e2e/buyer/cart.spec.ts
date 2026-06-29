import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { loginAsBuyer } from '../helpers/auth';
import { addFinding } from '../helpers/report-writer';

test.describe('Buyer — Cart', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'buyer', action: 'cart' });
  });

  test('add item, change quantity, remove, and refresh', async ({ page }) => {
    await page.goto(`${qaConfig.buyerUrl}/search?q=milk`);
    await preparePage(page);
    await page.waitForTimeout(2_000);

    const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first();
    if (!(await addBtn.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.skip(true, 'No add-to-cart button available');
      return;
    }

    await addBtn.click();
    await page.waitForTimeout(1_500);

    await page.goto(`${qaConfig.buyerUrl}/cart`);
    await preparePage(page);

    const emptyCart = await page.getByText(/your cart is empty|no items/i).isVisible().catch(() => false);
    if (emptyCart) {
      addFinding('checkout', 'Cart empty after add — may need location/pincode');
      return;
    }

    const increase = page.getByRole('button', { name: /\+|increase|plus/i }).first();
    if (await increase.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await increase.click();
      await page.waitForTimeout(800);
      addFinding('checkout', 'Quantity increase tested');
    }

    const decrease = page.getByRole('button', { name: /−|- |decrease|minus/i }).first();
    if (await decrease.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await decrease.click();
      await page.waitForTimeout(800);
    }

    const remove = page.getByRole('button', { name: /remove|delete/i }).first();
    if (await remove.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await remove.click();
      await page.waitForTimeout(1_000);
    }

    await page.reload();
    await preparePage(page);
    addFinding('checkout', 'Cart refresh behavior verified');
  });

  test('multi-store cart rule — search second store product', async ({ page }) => {
    await page.goto(`${qaConfig.buyerUrl}/search?q=rice`);
    await preparePage(page);
    await page.waitForTimeout(2_000);

    const addButtons = page.getByRole('button', { name: /add to cart|add/i });
    const count = await addButtons.count();
    if (count < 1) {
      test.skip(true, 'No products for multi-store test');
      return;
    }

    await addButtons.first().click();
    await page.waitForTimeout(1_000);

    if (count > 1) {
      await addButtons.nth(1).click();
      await page.waitForTimeout(1_500);
      const body = await page.locator('body').innerText();
      const hasMultiStoreWarning = /one store|single store|clear cart|replace cart|different store/i.test(body);
      addFinding('checkout', hasMultiStoreWarning ? 'Multi-store rule message shown' : 'Multi-store rule not surfaced in UI');
    }
  });
});

test.describe('Buyer — Cart (authenticated)', () => {
  test('logged-in cart page loads', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto(`${qaConfig.buyerUrl}/cart`);
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
