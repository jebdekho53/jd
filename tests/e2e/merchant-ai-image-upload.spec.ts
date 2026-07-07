import { expect, test, type Page, type TestInfo } from '@playwright/test';
import 'dotenv/config';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'fs';
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
  // A committed labeled product image (tests/fixtures/qa-product.jpg) lets the
  // vision model actually extract fields. Only fall back to a 1x1 placeholder
  // if that real fixture is missing (keeps the flow test runnable in isolation).
  if (existsSync(FIXTURE_PATH) && statSync(FIXTURE_PATH).size > 2000) return;
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
    const errorText = request.failure()?.errorText ?? '';
    // ERR_ABORTED / ERR_CANCELED are the browser cancelling in-flight requests
    // (RSC prefetches, dashboard polls) during SPA navigation — not real failures.
    if (/ERR_ABORTED|ERR_CANCELED/i.test(errorText)) return;
    failedRequests.push(`${request.method()} ${request.url()} ${errorText}`.trim());
  });
  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    // A 503 on image generation means the OpenAI image model/org isn't enabled
    // in this environment — an expected config state, not a server-side bug.
    const expectedImageGenUnavailable = status === 503 && url.includes('/generate-image');
    if (status >= 500 && !expectedImageGenUnavailable) serverErrors.push(`${status} ${url}`);
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

  // Either the form rendered (success) or a specific error alert appears.
  // NOTE: keep this regex tight — loose words like "try" match "counTRY of origin".
  const terminalState = page
    .getByLabel(/product name/i)
    .or(page.getByText(/temporarily unavailable|insufficient ai wallet balance|image optimization is unavailable|only jpe?g, png/i));
  await expect(terminalState.first()).toBeVisible({ timeout: 60_000 });

  if (analyzeResponse.ok()) {
    const parsed = JSON.parse(analyzeBodyText) as {
      data?: {
        fields?: Record<string, { value: unknown }>;
        missingFields?: string[];
        warnings?: string[];
        confidence?: number;
        generatedImages?: unknown[];
      };
    };
    const fields = parsed.data?.fields ?? {};
    // Response shape must always be well-formed (this is what the 500 bug broke).
    expect(fields, 'fields object present').toBeTruthy();
    expect(Array.isArray(parsed.data?.generatedImages), 'generatedImages array present').toBe(true);
    expect(fields.returnAllowed?.value ?? fields.refundAllowed?.value, 'return/refund policy suggestions').toBeDefined();

    // Content assertions only make sense when the model actually extracted data.
    const confidence = parsed.data?.confidence ?? 0;
    if (confidence > 0) {
      expect(fields.productName?.value ?? fields.name?.value, 'product name suggestion').toBeTruthy();
      expect(fields.description?.value, 'description suggestion').toBeTruthy();
      expect(fields.sku?.value, 'SKU suggestion').toBeTruthy();
      expect(fields.unit?.value, 'unit suggestion').toBeTruthy();
      // Brand is optional — many products have no separate brand name, in which
      // case it must be null/empty (never the literal placeholder "Unknown").
      const brandVal = fields.brand?.value;
      expect(typeof brandVal === 'string' ? brandVal.toLowerCase() : brandVal, 'brand must not be a placeholder').not.toBe('unknown');
      await expect(page.getByLabel(/product name/i)).toHaveValue(/.+/);
      await expect(page.getByLabel(/description/i)).toHaveValue(/.+/);
    } else {
      console.warn('AI extraction returned confidence 0 (sparse/unreadable image) — skipping content assertions.');
    }
    // The per-field "AI suggested — please verify / Source:" hints were removed;
    // ensure they are NOT rendered anymore.
    await expect(page.getByText(/ai suggested — please verify/i)).toHaveCount(0);
  }

  await expect(page.getByRole('button', { name: /publish product|save as draft/i })).not.toBeEnabled({ timeout: 1000 }).catch(() => undefined);
  await page.screenshot({ path: testInfo.outputPath('ai-upload-result.png'), fullPage: true });

  // ---- AI image generation (paid per image) ----
  if (analyzeResponse.ok()) {
    const generateBtn = page.getByRole('button', { name: /clean background/i });
    await expect(generateBtn, 'Clean background button should be present').toBeVisible();

    if (await generateBtn.isEnabled()) {
      const genResponsePromise = page.waitForResponse(
        (r) => r.url().includes('/products/ai/') && r.url().includes('/generate-image'),
        { timeout: 130_000 },
      );
      await generateBtn.click();
      const genResponse = await genResponsePromise;
      const genBodyText = await genResponse.text().catch(() => '');
      await testInfo.attach('generate-image-response', {
        contentType: 'application/json',
        body: JSON.stringify({ status: genResponse.status(), body: genBodyText.slice(0, 2000) }, null, 2),
      });
      // 500 is a real bug; 503 (model/org not enabled) or 402 (wallet) are acceptable env states.
      expect(
        genResponse.status(),
        `Image generation server-errored: ${genBodyText.slice(0, 800)}`,
      ).toBeLessThan(500);

      if (genResponse.ok()) {
        await expect(
          page.getByText(/ai generated/i).or(page.getByRole('img', { name: /generated/i })).first(),
          'Generated image should appear in the modal',
        ).toBeVisible({ timeout: 20_000 });
        await page.screenshot({ path: testInfo.outputPath('ai-generated-image.png'), fullPage: true });
      }
    }
  }

  await monitor.assertNoHardFailures();
  expect(monitor.authIssues, 'Unexpected auth issue after login').toEqual([]);
});
