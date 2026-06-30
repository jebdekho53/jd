import * as fs from 'fs';
import * as path from 'path';
import type { Browser, Page } from '@playwright/test';
import { qaConfig } from '../test-config';
import { loginAsAdmin, loginAsBuyer, loginAsMerchant } from './auth';

export type AuthRole = 'buyer' | 'merchant' | 'admin';

export function authStatePath(role: AuthRole): string {
  return path.resolve(process.cwd(), 'playwright', '.auth', `${role}.json`);
}

export function ensureAuthDir(): void {
  fs.mkdirSync(path.dirname(authStatePath('buyer')), { recursive: true });
}

export async function ensureRoleStorageState(browser: Browser, role: AuthRole): Promise<string> {
  const file = authStatePath(role);
  if (fs.existsSync(file)) return file;

  ensureAuthDir();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    if (role === 'buyer') await loginAsBuyer(page);
    if (role === 'merchant') await loginAsMerchant(page);
    if (role === 'admin') await loginAsAdmin(page);
    await context.storageState({ path: file });
    return file;
  } finally {
    await context.close();
  }
}

export async function newRolePage(browser: Browser, role: AuthRole): Promise<Page> {
  const storageState = await ensureRoleStorageState(browser, role);
  const baseURL =
    role === 'buyer'
      ? qaConfig.buyerUrl
      : role === 'merchant'
        ? qaConfig.merchantUrl
        : qaConfig.adminUrl;
  const context = await browser.newContext({ baseURL, storageState });
  return context.newPage();
}
