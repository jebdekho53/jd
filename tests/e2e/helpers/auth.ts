import type { BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { qaConfig } from '../test-config';
import { attachPageMonitoring } from './monitoring';
import { dismissOverlays } from './safe-click';

export async function loginAsBuyer(page: Page): Promise<void> {
  attachPageMonitoring(page, { app: 'buyer', action: 'buyer-login' });
  await page.goto(`${qaConfig.buyerUrl}/login`);
  await dismissOverlays(page);

  const emailTab = page.getByRole('button', { name: 'Email' });
  if (await emailTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await emailTab.click();
  }

  const email = page.getByLabel('Email').or(page.locator('input[type="email"]')).first();
  const password = page.getByLabel('Password').or(page.locator('input[type="password"]')).first();
  await email.fill(qaConfig.buyer.email);
  await password.fill(qaConfig.buyer.password);
  await page.getByRole('button', { name: /^login$/i }).click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
  await expect(page).not.toHaveURL(/\/login/);
}

export async function loginAsMerchant(page: Page): Promise<void> {
  attachPageMonitoring(page, { app: 'merchant', action: 'merchant-login' });
  await page.goto(`${qaConfig.merchantUrl}/login`);
  await dismissOverlays(page);

  const email = page.getByLabel('Email').or(page.locator('input[type="email"]')).first();
  const password = page.getByLabel('Password').or(page.locator('input[type="password"]')).first();
  await email.fill(qaConfig.merchant.email);
  await password.fill(qaConfig.merchant.password);
  await page.getByRole('button', { name: /verify.*sign in|sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  attachPageMonitoring(page, { app: 'admin', action: 'admin-login' });
  await page.goto(`${qaConfig.adminUrl}/login`, { waitUntil: 'domcontentloaded' });
  await dismissOverlays(page);

  await page
    .getByRole('status', { name: 'Loading' })
    .waitFor({ state: 'hidden', timeout: 90_000 })
    .catch(() => undefined);
  await page.getByRole('heading', { name: /sign in/i }).waitFor({ timeout: 90_000 });

  const email = page
    .getByPlaceholder('admin@jebdekho.com')
    .or(page.getByLabel('Email'))
    .or(page.locator('input[type="email"]'))
    .first();
  const password = page.getByLabel('Password').or(page.locator('input[type="password"]')).first();
  await email.fill(qaConfig.admin.email);
  await password.fill(qaConfig.admin.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60_000 });
}

export async function logoutBuyer(page: Page): Promise<void> {
  await page.goto(`${qaConfig.buyerUrl}/profile`);
  const logout = page.getByRole('button', { name: /log out|sign out|logout/i });
  if (await logout.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await logout.click();
    await page.waitForURL(/login|\//, { timeout: 15_000 });
  }
}

export async function logoutMerchant(context: BrowserContext): Promise<void> {
  const page = context.pages()[0] ?? (await context.newPage());
  const signOut = page.getByRole('button', { name: /sign out/i });
  if (await signOut.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await signOut.click();
    await page.waitForURL(/login/, { timeout: 15_000 });
  }
}

export async function logoutAdmin(context: BrowserContext): Promise<void> {
  const page = context.pages()[0] ?? (await context.newPage());
  const signOut = page.getByRole('button', { name: /sign out/i });
  if (await signOut.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await signOut.click();
    await page.waitForURL(/login/, { timeout: 15_000 });
  }
}

export async function clearAuthState(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
