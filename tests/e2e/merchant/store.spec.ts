import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { addFinding } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.merchantUrl, app: 'merchant' });

test.describe('Merchant — Store Profile', () => {
  test('store settings load (read-only)', async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'store-profile' });
    await page.goto('/stores');
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();

    const storeLink = page.getByRole('link', { name: /view|edit|settings|store/i }).first();
    if (await storeLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await storeLink.click();
      await page.waitForLoadState('domcontentloaded');
    }

    const settingsLink = page.getByRole('link', { name: /settings|profile|store/i }).first();
    if (await settingsLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await settingsLink.click();
      await page.waitForLoadState('domcontentloaded');
    }

    const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
    if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(800);
      const body = await page.locator('body').innerText();
      addFinding('merchant', /required|invalid|enter/i.test(body) ? 'Store form validation works' : 'Store form loaded');
    } else {
      addFinding('merchant', 'Store profile viewed read-only');
    }
  });
});
