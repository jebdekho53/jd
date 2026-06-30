import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { addFinding, recordManualVerification } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.merchantUrl, app: 'merchant' });

const ATHARV_STORE_ID = 'cmqtxuo1k0038l2ha01qry4qj';

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
    await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible();
    await expect(page.getByText(/Incoming|Preparation|Packing|Ready Queue|Dispatch/).first()).toBeVisible();
  });

  test('orders API accepts production list and live limits', async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'orders-api-limits' });

    const list = await page.request.get(
      `${qaConfig.merchantUrl}/api/merchant/orders?storeId=${ATHARV_STORE_ID}&limit=100`,
    );
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(listBody.success).toBeTruthy();
    expect(listBody.data).toEqual(expect.objectContaining({ orders: expect.any(Array) }));

    const live = await page.request.get(
      `${qaConfig.merchantUrl}/api/merchant/orders?merchantStatusGroup=active&storeId=${ATHARV_STORE_ID}&limit=200`,
    );
    expect(live.status()).toBe(200);
    const liveBody = await live.json();
    expect(liveBody.success).toBeTruthy();
    expect(liveBody.data).toEqual(expect.objectContaining({ orders: expect.any(Array) }));
  });
});
