import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { appendToRunState } from './report-writer';
import { getStorageKeySummary } from './monitoring';

export interface AccessCheckResult {
  pass: boolean;
  actual: string;
}

export async function checkProtectedRoute(
  page: Page,
  opts: {
    role: string;
    url: string;
    action: string;
    loginPath: RegExp;
    forbiddenPatterns?: RegExp[];
  },
): Promise<AccessCheckResult> {
  const beforeUrl = page.url();
  await page.goto(opts.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1_500);

  const currentUrl = page.url();
  const body = await page.locator('body').innerText().catch(() => '');

  const redirectedToLogin = opts.loginPath.test(currentUrl);
  const forbidden = opts.forbiddenPatterns?.some((p) => p.test(body)) ?? false;
  const hasStackTrace = /stack trace|at \w+\.\w+ \(/i.test(body);
  const tokenInUrl = /access_token|refresh_token|token=/i.test(currentUrl);

  let actual = 'unknown';
  let pass = false;

  if (redirectedToLogin) {
    actual = `Redirected to login: ${currentUrl}`;
    pass = true;
  } else if (/403|access denied|not authorized|unauthorized/i.test(body)) {
    actual = 'Access denied message shown';
    pass = true;
  } else if (forbidden) {
    actual = 'Forbidden content pattern detected';
    pass = false;
  } else if (currentUrl.includes('/dashboard') && opts.role !== 'admin' && opts.url.includes('admin')) {
    actual = 'Admin dashboard accessible — RBAC failure';
    pass = false;
  } else if (opts.url.includes('merchant') && currentUrl.includes('/dashboard') && opts.role === 'buyer') {
    actual = 'Merchant dashboard accessible to buyer';
    pass = false;
  } else {
    actual = `Remained on or navigated to: ${currentUrl}`;
    pass = !opts.url.includes('/dashboard');
  }

  if (hasStackTrace) pass = false;
  if (tokenInUrl) pass = false;

  const storage = await getStorageKeySummary(page);

  appendToRunState({
    rbacResults: [
      {
        role: opts.role,
        url: opts.url,
        action: opts.action,
        expected: 'Redirect to login or 403',
        actual: `${actual}; storage keys: local=[${storage.localStorage.join(', ')}]`,
        pass,
        timestamp: new Date().toISOString(),
      },
    ],
  });

  if (hasStackTrace) {
    appendToRunState({
      issues: [
        {
          id: `rbac-stack-${Date.now()}`,
          title: 'Stack trace visible on protected route check',
          severity: 'high',
          app: opts.url,
          url: currentUrl,
          role: opts.role,
          steps: `Visit ${opts.url} as ${opts.role}`,
          expected: 'Clean auth redirect',
          actual: 'Stack trace in page body',
        },
      ],
    });
  }

  return { pass, actual };
}

export async function expectNoInfiniteRedirect(page: Page): Promise<void> {
  const hops: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(400);
    hops.push(page.url());
  }
  if (hops.every((h) => h.includes('/login'))) return;
  const uniquePaths = [...new Set(hops.map((h) => new URL(h).pathname))];
  if (uniquePaths.length >= 3 && hops[0] === hops[hops.length - 1]) {
    throw new Error(`Possible redirect loop across: ${uniquePaths.join(' -> ')}`);
  }
}

export async function assertLoginRequired(page: Page): Promise<void> {
  const url = page.url();
  const body = await page.locator('body').innerText().catch(() => '');
  const isLogin =
    /\/login/.test(url) ||
    (await page.getByRole('button', { name: /sign in|login/i }).isVisible({ timeout: 3_000 }).catch(() => false)) ||
    /not authenticated|please log in|sign in to continue/i.test(body);
  expect(isLogin, `Expected login redirect, got ${url}`).toBeTruthy();
}
