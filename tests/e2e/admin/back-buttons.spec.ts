import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';

test.use({ baseURL: qaConfig.adminUrl, app: 'admin' });

test.describe('Admin — Back buttons', () => {
  test('logistics page has a back button', async ({ page }) => {
    attachPageMonitoring(page, { app: 'admin', action: 'logistics-back-button' });
    await page.goto('/logistics');
    await preparePage(page);
    await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible();
  });
});
