import { expect, test, type Page, type TestInfo } from '@playwright/test';

const URLS = {
  buyer: 'https://jebdekho.com',
  merchant: 'https://merchant.jebdekho.com',
  admin: 'https://admin.jebdekho.com',
  rider: 'https://rider.jebdekho.com',
} as const;

type AppName = keyof typeof URLS;

type Monitor = {
  consoleErrors: string[];
  serverErrors: string[];
  authIssues: string[];
  rememberMeFailures: string[];
  assertNoServerErrors: () => Promise<void>;
};

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function requireSecret(testInfo: TestInfo, name: string): string {
  const value = env(name);
  test.skip(!value, `${name} is required in the environment for this login check`);
  return value!;
}

async function startMonitor(page: Page, testInfo: TestInfo): Promise<Monitor> {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];
  const authIssues: string[] = [];
  const rememberMeFailures: string[] = [];
  const bodyChecks: Promise<void>[] = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    consoleErrors.push(text);
    if (/column remember_me does not exist/i.test(text)) {
      rememberMeFailures.push(`console: ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(`pageerror: ${error.message}`);
    if (/column remember_me does not exist/i.test(error.message)) {
      rememberMeFailures.push(`pageerror: ${error.message}`);
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 500) {
      serverErrors.push(`${status} ${url}`);
    } else if (status === 401 || status === 403) {
      authIssues.push(`${status} ${url}`);
    }

    if (status >= 400 && /signup|auth\/signup/i.test(url)) {
      bodyChecks.push(
        response
          .text()
          .then((text) => {
            if (/column remember_me does not exist/i.test(text)) {
              rememberMeFailures.push(`${status} ${url}`);
            }
          })
          .catch(() => undefined),
      );
    }
  });

  return {
    consoleErrors,
    serverErrors,
    authIssues,
    rememberMeFailures,
    assertNoServerErrors: async () => {
      await Promise.all(bodyChecks);
      await testInfo.attach('network-and-console-summary', {
        contentType: 'application/json',
        body: JSON.stringify({ serverErrors, authIssues, consoleErrors, rememberMeFailures }, null, 2),
      });
      expect(serverErrors, 'Unexpected HTTP 500 responses').toEqual([]);
      expect(rememberMeFailures, 'Signup remember_me database regression returned').toEqual([]);
    },
  };
}

async function goto(page: Page, pathOrUrl: string) {
  await page.goto(pathOrUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

async function openLogin(page: Page, app: AppName) {
  const path = app === 'rider' ? '/' : '/login';
  await goto(page, `${URLS[app]}${path}`);
}

async function switchToPasswordLoginIfAvailable(page: Page) {
  for (const name of [/email/i, /sign in with email/i, /use password/i]) {
    const trigger = page
      .getByRole('button', { name })
      .or(page.getByRole('link', { name }))
      .filter({ hasNot: page.locator('svg') })
      .first();
    if (await trigger.isVisible().catch(() => false)) {
      const label = ((await trigger.getAttribute('aria-label').catch(() => null)) ?? '').trim();
      if (/show password|hide password|toggle password|password visibility/i.test(label)) continue;
      await trigger.click();
      await page.waitForTimeout(300);
      if (await page.locator('input[type="password"]').first().isVisible().catch(() => false)) return;
    }
  }
}

async function verifyPasswordToggle(page: Page, required = true) {
  await switchToPasswordLoginIfAvailable(page);
  const password = page
    .locator('input[autocomplete="current-password"], input[autocomplete="new-password"], input[type="password"]')
    .first();
  const toggleButton = page
    .getByRole('button', { name: /show password|hide password|toggle password|password visibility/i })
    .first();
  if (!(await toggleButton.isVisible().catch(() => false))) {
    test.skip(!required, 'No password visibility toggle is available on this auth page');
  }

  await expect(toggleButton).toBeVisible();
  if ((await password.getAttribute('type')) === 'text') {
    await toggleButton.click();
  }
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: /show password|toggle password|password visibility/i }).first().click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: /hide password|toggle password|password visibility/i }).first().click();
  await expect(password).toHaveAttribute('type', 'password');
}

async function fillIfVisible(page: Page, selector: string, value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const field = page.locator(selector).first();
  if (!(await field.isVisible().catch(() => false))) return false;
  await field.fill(value);
  return true;
}

async function submitLogin(page: Page) {
  const button = page
    .getByRole('button', { name: /log in|login|sign in|continue/i })
    .filter({ hasNotText: /otp/i })
    .first();
  await expect(button).toBeVisible();
  await button.click();
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

async function loginWithPassword(
  page: Page,
  testInfo: TestInfo,
  options: {
    emailEnv?: string;
    phoneEnv?: string;
    passwordEnv: string;
    successPath: string;
  },
) {
  const password = requireSecret(testInfo, options.passwordEnv);
  const email = options.emailEnv ? env(options.emailEnv) : undefined;
  const phone = options.phoneEnv ? env(options.phoneEnv) : undefined;

  await switchToPasswordLoginIfAvailable(page);
  test.skip(!(await page.locator('input[type="password"]').first().isVisible().catch(() => false)), 'Password login is not available');

  const filledEmail = await fillIfVisible(page, 'input[type="email"], input[name*="email" i]', email);
  const filledPhone = filledEmail
    ? false
    : await fillIfVisible(page, 'input[type="tel"], input[name*="phone" i], input[autocomplete="tel"]', phone);
  test.skip(!filledEmail && !filledPhone, 'No email/phone credential env var matched a visible login field');

  await page.locator('input[type="password"]').first().fill(password);
  await submitLogin(page);
  await expect(page).toHaveURL(new RegExp(options.successPath));
}

async function assertPagesLoadWithout500(page: Page, baseUrl: string, paths: string[], testInfo: TestInfo) {
  for (const path of paths) {
    const monitor = await startMonitor(page, testInfo);
    await goto(page, `${baseUrl}${path}`);
    await expect(page.locator('body')).toBeVisible();
    await monitor.assertNoServerErrors();
  }
}

test.describe('Production buyer auth', () => {
  test('login loads', async ({ page }, testInfo) => {
    const monitor = await startMonitor(page, testInfo);
    await openLogin(page, 'buyer');
    await expect(page.locator('body')).toBeVisible();
    await monitor.assertNoServerErrors();
  });

  test('password eye toggles', async ({ page }) => {
    await openLogin(page, 'buyer');
    await verifyPasswordToggle(page);
  });

  test('signup regression is absent', async ({ page }, testInfo) => {
    const signupMonitor = await startMonitor(page, testInfo);
    await goto(page, `${URLS.buyer}/signup`);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/column remember_me does not exist/i);
    await signupMonitor.assertNoServerErrors();
  });

  test('login succeeds and read-only pages load', async ({ page }, testInfo) => {
    await openLogin(page, 'buyer');
    await loginWithPassword(page, testInfo, {
      emailEnv: 'BUYER_EMAIL',
      phoneEnv: 'BUYER_PHONE',
      passwordEnv: 'BUYER_PASSWORD',
      successPath: '/(profile|orders|cart|$)',
    });
    await assertPagesLoadWithout500(page, URLS.buyer, ['/profile', '/orders', '/cart'], testInfo);
  });
});

test.describe('Production merchant auth', () => {
  test('login loads', async ({ page }, testInfo) => {
    const monitor = await startMonitor(page, testInfo);
    await openLogin(page, 'merchant');
    await expect(page.locator('body')).toBeVisible();
    await monitor.assertNoServerErrors();
  });

  test('password eye toggles', async ({ page }) => {
    await openLogin(page, 'merchant');
    await verifyPasswordToggle(page);
  });

  test('login succeeds and key pages load', async ({ page }, testInfo) => {
    await openLogin(page, 'merchant');
    await loginWithPassword(page, testInfo, {
      emailEnv: 'MERCHANT_EMAIL',
      phoneEnv: 'MERCHANT_PHONE',
      passwordEnv: 'MERCHANT_PASSWORD',
      successPath: '/(dashboard|stores|onboarding|$)',
    });
    await assertPagesLoadWithout500(page, URLS.merchant, ['/dashboard', '/products', '/orders', '/stores', '/categories'], testInfo);
  });
});

test.describe('Production admin auth', () => {
  test('login loads', async ({ page }, testInfo) => {
    const monitor = await startMonitor(page, testInfo);
    await openLogin(page, 'admin');
    await expect(page.locator('body')).toBeVisible();
    await monitor.assertNoServerErrors();
  });

  test('password eye toggles', async ({ page }) => {
    await openLogin(page, 'admin');
    await verifyPasswordToggle(page);
  });

  test('login succeeds and key pages load', async ({ page }, testInfo) => {
    await openLogin(page, 'admin');
    await loginWithPassword(page, testInfo, {
      emailEnv: 'ADMIN_EMAIL',
      phoneEnv: 'ADMIN_PHONE',
      passwordEnv: 'ADMIN_PASSWORD',
      successPath: '/(dashboard|$)',
    });
    await assertPagesLoadWithout500(
      page,
      URLS.admin,
      ['/dashboard', '/stores', '/merchant-applications', '/orders', '/catalog', '/settings/security'],
      testInfo,
    );
  });
});

test.describe('Production rider auth', () => {
  test('auth page loads and password login is exercised when available', async ({ page }, testInfo) => {
    const monitor = await startMonitor(page, testInfo);
    await openLogin(page, 'rider');
    await expect(page.locator('body')).toBeVisible();
    await monitor.assertNoServerErrors();

    if (await page.getByRole('button', { name: 'Show password' }).first().isVisible().catch(() => false)) {
      await verifyPasswordToggle(page, false);
      await loginWithPassword(page, testInfo, {
        phoneEnv: 'RIDER_PHONE',
        passwordEnv: 'RIDER_PASSWORD',
        successPath: '/(dashboard|orders|$)',
      });
    }
  });
});
