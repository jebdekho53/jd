import { test, expect } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { addFinding } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.merchantUrl, app: 'merchant' });

test.describe('Merchant — Login', () => {
  test('dashboard loads with saved session', async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'login' });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard|stores/);
    await expect(page.locator('body')).not.toBeEmpty();
    addFinding('merchant', `Merchant session active at ${page.url()}`);
  });
});
