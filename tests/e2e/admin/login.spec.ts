import { test, expect } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { addFinding } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.adminUrl, app: 'admin' });

test.describe('Admin — Login', () => {
  test('dashboard loads with saved session', async ({ page }) => {
    attachPageMonitoring(page, { app: 'admin', action: 'login' });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('body')).not.toBeEmpty();
    addFinding('admin', 'Admin dashboard loaded');
  });
});
