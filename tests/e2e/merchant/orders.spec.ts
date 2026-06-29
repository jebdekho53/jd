import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { addFinding, recordManualVerification } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.merchantUrl, app: 'merchant' });

test.describe('Merchant — Orders', () => {
  test('orders list and detail (read-only)', async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'orders' });
    await page.goto('/dashboard');
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();

    const orderLink = page.getByRole('link', { name: /JD-|order|view/i }).first();
    if (await orderLink.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await orderLink.click();
      await page.waitForLoadState('domcontentloaded');
      addFinding('merchant', 'Order detail opened');

      const acceptBtn = page.getByRole('button', { name: /accept|reject|dispatch|ready|preparing/i });
      const count = await acceptBtn.count();
      if (count > 0) {
        recordManualVerification('Merchant order actions', 'Accept/reject/dispatch not clicked on production orders');
        addFinding('merchant', `Order action buttons present (${count}) — manual verification required`);
      }
    } else {
      addFinding('merchant', 'No orders visible or empty state shown');
    }
  });

  test('live orders page loads', async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'live-orders' });
    await page.goto('/dashboard');
    await page.goto('/orders/live');
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
