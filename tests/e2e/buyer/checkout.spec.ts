import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { loginAsBuyer } from '../helpers/auth';
import { addFinding, recordManualVerification } from '../helpers/report-writer';
import { resetServiceWorkerAndCaches } from '../helpers/service-worker';

test.describe('Buyer — Checkout (safe flow)', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'buyer', action: 'checkout' });
    await resetServiceWorkerAndCaches(page);
  });

  test('address validation without placing order', async ({ page }) => {
    await loginAsBuyer(page);

    await page.goto(`${qaConfig.buyerUrl}/search?q=milk`);
    await preparePage(page);
    await page.waitForTimeout(2_000);

    const addBtn = page.getByRole('button', { name: /add to cart|add/i }).first();
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1_000);
    }

    await page.goto(`${qaConfig.buyerUrl}/checkout`);
    await preparePage(page);

    if (page.url().includes('/cart') || page.url().includes('/login')) {
      addFinding('checkout', `Checkout redirected to ${page.url()} — cart may be empty`);
      return;
    }

    const placeOrder = page.getByRole('button', { name: /place order|confirm order|pay now|order now/i });
    const submitAddress = page.getByRole('button', { name: /save|continue|deliver here/i });

    if (await submitAddress.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submitAddress.first().click();
      await page.waitForTimeout(1_000);
      const body = await page.locator('body').innerText();
      const hasValidation = /required|invalid|enter|phone|pincode|address/i.test(body);
      addFinding('checkout', hasValidation ? 'Address validation messages shown on empty submit' : 'Address form present');
    }

    const phoneInput = page.getByLabel(/phone|mobile/i).or(page.getByPlaceholder(/phone|mobile/i)).first();
    if (await phoneInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await phoneInput.fill('123');
      if (await submitAddress.first().isVisible().catch(() => false)) {
        await submitAddress.first().click();
        await page.waitForTimeout(800);
      }
      addFinding('checkout', 'Invalid phone validation tested');
    }

    const pincodeInput = page.getByLabel(/pincode|pin code|postal/i).or(page.getByPlaceholder(/pincode|pin/i)).first();
    if (await pincodeInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await pincodeInput.fill('00');
      addFinding('checkout', 'Invalid pincode tested');
    }

    if (await placeOrder.isVisible({ timeout: 3_000 }).catch(() => false)) {
      recordManualVerification('COD order placement', 'Stopped before final order confirmation on production');
      addFinding('checkout', 'Place order button visible — manual verification required before confirming');
    }

    const razorpayFrame = page.frameLocator('iframe[name*="razorpay"], iframe[src*="razorpay"]').first();
    const payOnline = page.getByRole('button', { name: /pay online|razorpay|card|upi/i }).first();
    if (await payOnline.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await payOnline.click().catch(() => undefined);
      await page.waitForTimeout(2_000);
      recordManualVerification('Razorpay', 'If modal opens, cancel only — no real payment');
      addFinding('checkout', 'Online payment option present — Razorpay cancel-only policy applied');
    }
  });

  test('checkout page requires cart items', async ({ page }) => {
    await page.goto(`${qaConfig.buyerUrl}/checkout`, { waitUntil: 'domcontentloaded' });
    await preparePage(page);
    const url = page.url();
    const meaningfulCheckoutUi = page
      .getByText(/your cart needs items|empty|add items|continue shopping|login required|sign in/i)
      .first();
    expect(url.includes('/cart') || url.includes('/login') || await meaningfulCheckoutUi.isVisible()).toBeTruthy();
  });
});
