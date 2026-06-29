import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { addFinding, recordManualVerification } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.adminUrl, app: 'admin' });

test.describe('Admin — Merchant Approvals', () => {
  test('pending merchants list and detail (read-only)', async ({ page }) => {
    attachPageMonitoring(page, { app: 'admin', action: 'merchant-approvals' });
    await page.goto('/merchant-applications');
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();

    const merchantLink = page.getByRole('link', { name: /view|application|merchant|store/i }).first();
    if (await merchantLink.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await merchantLink.click();
      await page.waitForLoadState('domcontentloaded');

      const approve = page.getByRole('button', { name: /approve/i });
      const reject = page.getByRole('button', { name: /reject/i });
      if ((await approve.count()) > 0 || (await reject.count()) > 0) {
        recordManualVerification('Merchant approval', 'Approve/reject not executed on production');
        addFinding('admin', 'Merchant approval buttons present — manual verification required');
      }
    } else {
      addFinding('admin', 'Merchant applications page loaded (empty or list)');
    }
  });
});
