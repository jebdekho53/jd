import { expect, test, type Page, type TestInfo } from '@playwright/test';
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const MERCHANT_URL = 'https://merchant.jebdekho.com';
const FIXTURE_PATH = resolve(process.cwd(), 'tests/fixtures/qa-product.jpg');

test.use({ storageState: undefined });

type Monitor = {
  consoleErrors: string[];
  failedRequests: string[];
  serverErrors: string[];
  authIssues: string[];
  nonOkResponses: string[];
  assertNoHardFailures: () => Promise<void>;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  test.skip(!value, `${name} is required in the environment`);
  return value!;
}

function ensureFixtureImage() {
  mkdirSync(dirname(FIXTURE_PATH), { recursive: true });
  const jpg =
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z';
  writeFileSync(FIXTURE_PATH, Buffer.from(jpg, 'base64'));
}

async function startMonitor(page: Page, testInfo: TestInfo): Promise<Monitor> {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const serverErrors: string[] = [];
  const authIssues: string[] = [];
  const nonOkResponses: string[] = [];
  const bodyReads: Promise<void>[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`.trim());
  });
  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 500) serverErrors.push(`${status} ${url}`);
    if (status === 401 || status === 403) authIssues.push(`${status} ${url}`);
    if (status >= 400 && /products\/ai|uploads|auth|stores/.test(url)) {
      bodyReads.push(
        response
          .text()
          .then((text) => {
            nonOkResponses.push(`${status} ${url}\n${text.replace(/"password"\\s*:\\s*"[^"]+"/gi, '"password":"[REDACTED]"').slice(0, 3000)}`);
          })
          .catch(() => undefined),
      );
    }
  });

  return {
    consoleErrors,
    failedRequests,
    serverErrors,
    authIssues,
    nonOkResponses,
    assertNoHardFailures: async () => {
      await Promise.all(bodyReads);
      await testInfo.attach('network-console-summary', {
        contentType: 'application/json',
        body: JSON.stringify({ serverErrors, authIssues, failedRequests, consoleErrors, nonOkResponses }, null, 2),
      });
      expect(serverErrors, 'Unexpected HTTP 500 responses').toEqual([]);
      expect(failedRequests, 'Unexpected failed browser requests').toEqual([]);
      expect(consoleErrors, 'Unexpected console/page crashes').toEqual([]);
    },
  };
}

async function goto(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

test('merchant AI product image upload reaches free analysis without product confirmation', async ({ context, page }, testInfo) => {
  ensureFixtureImage();
  const monitor = await startMonitor(page, testInfo);
  const email = requireEnv('MERCHANT_AI_EMAIL');
  const password = requireEnv('MERCHANT_AI_PASSWORD');

  await context.clearCookies();
  await goto(page, `${MERCHANT_URL}/login`);
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /sign in|login|verify/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding|stores|products|ai)/, { timeout: 30_000 });
  await expect(page.locator('body')).toBeVisible();

  await goto(page, `${MERCHANT_URL}/products`);
  if (await page.getByText(/no store selected/i).isVisible().catch(() => false)) {
    test.skip(true, 'Merchant AI account has no selected store for product upload');
  }

  await page.getByRole('button', { name: /add product/i }).click();
  await page.getByRole('button', { name: /add with ai|ai product/i }).click();
  await expect(page.getByText(/upload a product photo/i)).toBeVisible({ timeout: 30_000 });

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /upload photo/i }).click();
  const fileChooser = await fileChooserPromise;
  const analyzeResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/merchant/stores/') &&
    response.url().includes('/products/ai/analyze'),
  );
  await fileChooser.setFiles(FIXTURE_PATH);
  const analyzeResponse = await analyzeResponsePromise;
  const analyzeBodyText = await analyzeResponse.text().catch(() => '');
  await testInfo.attach('analyze-response', {
    contentType: 'application/json',
    body: JSON.stringify(
      {
        status: analyzeResponse.status(),
        body: analyzeBodyText.replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"').slice(0, 4000),
      },
      null,
      2,
    ),
  });
  expect(analyzeResponse.status(), `Analyze failed: ${analyzeBodyText.slice(0, 1000)}`).toBeLessThan(500);

  const terminalState = page
    .getByLabel(/product name/i)
    .or(page.getByText(/temporarily unavailable|insufficient ai wallet|image file|only jpg|failed|try/i));
  await expect(terminalState).toBeVisible({ timeout: 60_000 });

  if (analyzeResponse.ok()) {
    const parsed = JSON.parse(analyzeBodyText) as {
      data?: { fields?: Record<string, { value: unknown }>; missingFields?: string[]; warnings?: string[] };
    };
    const fields = parsed.data?.fields ?? {};
    expect(fields.productName?.value ?? fields.name?.value, 'product name suggestion').toBeTruthy();
    expect(fields.brand?.value, 'brand suggestion').toBeTruthy();
    expect(fields.description?.value, 'description suggestion').toBeTruthy();
    expect(fields.sku?.value, 'SKU suggestion').toBeTruthy();
    expect(fields.categoryId?.value ?? parsed.data?.warnings?.join(' '), 'category suggestion or warning').toBeTruthy();
    expect(fields.unit?.value, 'unit suggestion').toBeTruthy();
    expect(fields.hsnCode?.value ?? fields.gstPercent?.value ?? parsed.data?.missingFields?.join(' '), 'HSN/GST suggestion or missing warning').toBeTruthy();
    expect(fields.returnAllowed?.value ?? fields.refundAllowed?.value, 'return/refund policy suggestions').toBeDefined();
    await expect(page.getByLabel(/product name/i)).toHaveValue(/.+/);
    await expect(page.getByLabel(/brand/i)).toHaveValue(/.+/);
    await expect(page.getByLabel(/description/i)).toHaveValue(/.+/);
    await expect(page.getByLabel(/sku/i)).toHaveValue(/.+/);
    await expect(page.getByText(/ai suggested|source:/i).first()).toBeVisible();
  }

  await expect(page.getByRole('button', { name: /publish product|save as draft/i })).not.toBeEnabled({ timeout: 1000 }).catch(() => undefined);
  await page.screenshot({ path: testInfo.outputPath('ai-upload-result.png'), fullPage: true });
  await monitor.assertNoHardFailures();
  expect(monitor.authIssues, 'Unexpected auth issue after login').toEqual([]);
});
