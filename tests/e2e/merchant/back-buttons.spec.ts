import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';

test.use({ baseURL: qaConfig.merchantUrl, app: 'merchant' });

const ATHARV_STORE_ID = 'cmqtxuo1k0038l2ha01qry4qj';

test.describe('Merchant — Back buttons', () => {
  test('kitchen page has a back button', async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'kitchen-back-button' });
    await page.goto(`/stores/${ATHARV_STORE_ID}/kitchen`);
    await preparePage(page);
    await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible();
  });
});
