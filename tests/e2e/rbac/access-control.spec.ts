import { test, expect } from '@playwright/test';
import { qaConfig } from '../test-config';
import { clearAuthState, loginAsBuyer, loginAsMerchant, loginAsAdmin } from '../helpers/auth';
import { checkProtectedRoute, expectNoInfiniteRedirect } from '../helpers/rbac';
import { attachPageMonitoring } from '../helpers/monitoring';

test.describe('RBAC — Anonymous', () => {
  test.beforeEach(async ({ context }) => {
    await clearAuthState(context);
  });

  test('buyer protected URLs redirect to login', async ({ page, context }) => {
    attachPageMonitoring(page, { app: 'buyer', action: 'rbac-anonymous' });
    await clearAuthState(context);

    for (const path of ['/orders', '/profile', '/checkout']) {
      const result = await checkProtectedRoute(page, {
        role: 'anonymous',
        url: `${qaConfig.buyerUrl}${path}`,
        action: `visit ${path}`,
        loginPath: /\/login/,
      });
      expect(result.pass).toBeTruthy();
    }
  });

  test('merchant and admin URLs blocked for anonymous', async ({ page, context }) => {
    attachPageMonitoring(page, { app: 'rbac', action: 'rbac-anonymous-admin-merchant' });
    await clearAuthState(context);

    const merchant = await checkProtectedRoute(page, {
      role: 'anonymous',
      url: `${qaConfig.merchantUrl}/dashboard`,
      action: 'merchant dashboard',
      loginPath: /\/login/,
    });
    expect(merchant.pass).toBeTruthy();

    const admin = await checkProtectedRoute(page, {
      role: 'anonymous',
      url: `${qaConfig.adminUrl}/dashboard`,
      action: 'admin dashboard',
      loginPath: /\/login/,
    });
    expect(admin.pass).toBeTruthy();
  });
});

test.describe('RBAC — Buyer', () => {
  test('buyer cannot access merchant or admin dashboards', async ({ page, context }) => {
    attachPageMonitoring(page, { app: 'rbac', action: 'rbac-buyer' });
    await clearAuthState(context);
    await loginAsBuyer(page);

    const merchant = await checkProtectedRoute(page, {
      role: 'buyer',
      url: `${qaConfig.merchantUrl}/dashboard`,
      action: 'merchant dashboard',
      loginPath: /\/login/,
    });

    const admin = await checkProtectedRoute(page, {
      role: 'buyer',
      url: `${qaConfig.adminUrl}/dashboard`,
      action: 'admin dashboard',
      loginPath: /\/login/,
    });

    expect(merchant.pass || merchant.actual.includes('login')).toBeTruthy();
    expect(admin.pass || admin.actual.includes('login') || admin.actual.includes('denied')).toBeTruthy();
    await expectNoInfiniteRedirect(page);
  });
});

test.describe('RBAC — Merchant', () => {
  test('merchant cannot access admin dashboard', async ({ page, context }) => {
    attachPageMonitoring(page, { app: 'rbac', action: 'rbac-merchant' });
    await clearAuthState(context);
    await loginAsMerchant(page);

    const admin = await checkProtectedRoute(page, {
      role: 'merchant',
      url: `${qaConfig.adminUrl}/dashboard`,
      action: 'admin dashboard',
      loginPath: /\/login/,
    });

    expect(admin.pass || admin.actual.includes('login') || admin.actual.includes('denied')).toBeTruthy();
  });
});

test.describe('RBAC — Admin', () => {
  test('admin can access admin dashboard', async ({ page, context }) => {
    attachPageMonitoring(page, { app: 'rbac', action: 'rbac-admin' });
    await clearAuthState(context);
    await loginAsAdmin(page);

    await page.goto(`${qaConfig.adminUrl}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/dashboard');

    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/stack trace|internal server error/i);
    expect(page.url()).not.toMatch(/access_token|refresh_token/);
  });
});
