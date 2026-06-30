import { test, expect, preparePage } from '../fixtures/qa-fixture';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from '../helpers/monitoring';
import { addFinding, recordManualVerification } from '../helpers/report-writer';

test.use({ baseURL: qaConfig.merchantUrl, app: 'merchant' });

test.describe('Merchant — Products & Inventory', () => {
  test.beforeEach(async ({ page }) => {
    attachPageMonitoring(page, { app: 'merchant', action: 'products' });
    await page.goto('/dashboard');
  });

  test('products list, search, and detail', async ({ page }) => {
    await page.goto('/products');
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();

    const search = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox')).first();
    if (await search.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await search.fill('milk');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1_500);
      addFinding('merchant', 'Product search tested');
    }

    const productRow = page.getByRole('link', { name: /milk|product|edit/i }).first();
    if (await productRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await productRow.click();
      await page.waitForLoadState('domcontentloaded');
      addFinding('merchant', 'Product detail/edit page opened');
    }

    const createBtn = page.getByRole('link', { name: /add product|create|new product/i }).or(
      page.getByRole('button', { name: /add product|create|new product/i }),
    );
    if (await createBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      recordManualVerification('Create test product', 'Only create QA TEST PRODUCT if form is clearly isolated — skipped auto-create on production');
      addFinding('merchant', 'Create product flow available — manual verification for test product creation');
    }
  });

  test('inventory page loads', async ({ page }) => {
    await page.goto('/inventory');
    await preparePage(page);
    await expect(page.locator('body')).not.toBeEmpty();
    addFinding('merchant', 'Inventory page loaded');
  });

  test('AI usage and billing has a back button', async ({ page }) => {
    await page.goto('/products');
    await preparePage(page);
    await page.getByRole('button', { name: /AI Usage & Billing/i }).click();
    await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible();
  });
});
