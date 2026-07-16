import { expect, test, type Page, type TestInfo } from '@playwright/test';
import 'dotenv/config';

const MERCHANT_URL = 'https://merchant.jebdekho.com';

type Monitor = {
  consoleErrors: string[];
  failedRequests: string[];
  serverErrors: string[];
  authIssues: string[];
  responses: string[];
  assertHealthy: () => Promise<void>;
};

function randomPassword() {
  return `Qa!${Date.now()}-${Math.random().toString(36).slice(2)}A9`;
}

function randomPhone(timestamp: number) {
  return `+9197${String(timestamp).slice(-8)}`;
}

async function startMonitor(page: Page, testInfo: TestInfo): Promise<Monitor> {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const serverErrors: string[] = [];
  const authIssues: string[] = [];
  const responses: string[] = [];
  const bodyReads: Promise<void>[] = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/failed to load resource: the server responded with a status of (401|403)/i.test(text)) {
      authIssues.push(`console: ${text}`);
      return;
    }
    consoleErrors.push(text);
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
    if (status >= 400) {
      bodyReads.push(
        response
          .text()
          .then((text) => {
            responses.push(`${status} ${url}\n${text.slice(0, 2000)}`);
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
    responses,
    assertHealthy: async () => {
      await Promise.all(bodyReads);
      await testInfo.attach('network-console-summary', {
        contentType: 'application/json',
        body: JSON.stringify({ serverErrors, authIssues, failedRequests, consoleErrors, responses }, null, 2),
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

async function fillByLabel(page: Page, label: RegExp, value: string) {
  await page.getByLabel(label).first().fill(value);
}

test('new QA merchant can login mid-onboarding and resume safely', async ({ page }, testInfo) => {
  const monitor = await startMonitor(page, testInfo);
  const timestamp = Date.now();
  const email = `qa_merchant_${timestamp}@example.com`;
  const password = process.env.QA_MERCHANT_PASSWORD?.trim() || randomPassword();
  const phone = randomPhone(timestamp);

  await goto(page, `${MERCHANT_URL}/signup`);

  await fillByLabel(page, /owner name/i, `QA Merchant ${timestamp}`);
  await fillByLabel(page, /^email$/i, email);
  await fillByLabel(page, /^password$/i, password);
  await fillByLabel(page, /confirm password/i, password);
  const signupResponsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/signup'));
  await page.getByRole('button', { name: /create account/i }).click();
  const signupResponse = await signupResponsePromise;
  const signupBody = await signupResponse.text().catch(() => '');
  if (!signupResponse.ok()) {
    await testInfo.attach('signup-failure', {
      contentType: 'application/json',
      body: JSON.stringify({ status: signupResponse.status(), body: signupBody.slice(0, 2000) }, null, 2),
    });
  }
  expect(signupResponse.ok(), `Signup failed with ${signupResponse.status()}`).toBe(true);

  await expect(page.getByText(/business details/i)).toBeVisible({ timeout: 30_000 });
  const phoneInput = page.getByLabel(/store contact mobile/i).first();
  if (await phoneInput.isVisible().catch(() => false)) {
    await phoneInput.fill(phone.replace(/^\+91/, ''));
  }
  await fillByLabel(page, /owner full name/i, `QA Merchant ${timestamp}`);
  await fillByLabel(page, /business .*legal name/i, `QA Resume ${timestamp}`);
  const saveStepDone = page.waitForResponse(
    (response) =>
      response.url().includes('/api/merchant/onboarding/application') &&
      response.request().method() === 'PATCH' &&
      response.status() < 500,
  );
  await page.getByRole('button', { name: /^next|continue|save/i }).first().click();
  await saveStepDone;

  await expect(page.getByLabel(/store display name/i).or(page.getByRole('button', { name: /store details/i })).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await testInfo.attach('mid-onboarding-url', { contentType: 'text/plain', body: page.url() });
  await page.screenshot({ path: testInfo.outputPath('mid-onboarding.png'), fullPage: true });

  await goto(page, `${MERCHANT_URL}/login`);
  if (await page.getByLabel(/^email$/i).first().isVisible().catch(() => false)) {
    await fillByLabel(page, /^email$/i, email);
    await fillByLabel(page, /^password$/i, password);
    await page.getByRole('button', { name: /sign in|login|verify/i }).click();
  } else {
    await testInfo.attach('login-short-circuited-to-resume', {
      contentType: 'text/plain',
      body: page.url(),
    });
  }

  await page.waitForURL(/\/(dashboard|onboarding)(\/status)?/, { timeout: 30_000 });
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.locator('body')).not.toContainText(/loading/i, { timeout: 5000 });
  await expect(
    page
      .getByRole('heading', { name: /business details|store details|dashboard|application status/i })
      .or(page.getByRole('button', { name: /next|continue|submit|go to dashboard|view status/i }))
      .first(),
  ).toBeVisible();

  await testInfo.attach('qa-merchant-created', { contentType: 'application/json', body: JSON.stringify({ email, phone }, null, 2) });
  await page.screenshot({ path: testInfo.outputPath('after-login-resume.png'), fullPage: true });
  await monitor.assertHealthy();
});
