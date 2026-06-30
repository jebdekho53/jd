import { expect, type Page, type TestInfo } from '@playwright/test';
import { qaConfig } from '../test-config';
import {
  addIssue,
  appendToRunState,
  type ApiRequestEntry,
  type RouteAuditEntry,
} from './report-writer';
import { captureScreenshot } from './monitoring';

export type AuditApp = 'buyer' | 'merchant' | 'admin';

const API_ORIGIN = 'https://api.jebdekho.com';
const SAFE_PAYLOAD_KEYS = ['id', 'ids', 'status', 'page', 'limit', 'q', 'storeId', 'orderId', 'productId'];

export function attachProductionAudit(page: Page, app: AuditApp, testInfo: TestInfo): void {
  const requestStarted = new Map<string, number>();
  const requestPayloads = new Map<string, string>();

  page.on('request', (request) => {
    const url = request.url();
    if (!isAuditedApiUrl(url)) return;
    requestStarted.set(requestKey(request.method(), url), Date.now());
    requestPayloads.set(requestKey(request.method(), url), safePayloadShape(request.postData()));
  });

  page.on('response', async (response) => {
    const request = response.request();
    const url = response.url();
    if (!isAuditedApiUrl(url)) return;
    const key = requestKey(request.method(), url);
    const status = response.status();
    const entry: ApiRequestEntry = {
      app,
      page: page.url(),
      method: request.method(),
      url: sanitizeUrl(url),
      status,
      responseTimeMs: Date.now() - (requestStarted.get(key) ?? Date.now()),
      requestPayloadShape: requestPayloads.get(key),
      errorBody: status >= 400 ? await safeErrorBody(response) : undefined,
      timestamp: new Date().toISOString(),
    };
    appendToRunState({ apiRequests: [entry] });

    if (status >= 400) {
      appendToRunState({
        networkErrors: [
          {
            app,
            action: testInfo.title,
            method: request.method(),
            endpoint: sanitizeUrl(url),
            status,
            error: entry.errorBody ?? response.statusText(),
            timestamp: entry.timestamp,
          },
        ],
      });
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!isAuditedApiUrl(url)) return;
    appendToRunState({
      networkErrors: [
        {
          app,
          action: testInfo.title,
          method: request.method(),
          endpoint: sanitizeUrl(url),
          status: 0,
          error: request.failure()?.errorText ?? 'request failed',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    const text = msg.text();
    if (isBenignConsoleNoise(text)) return;
    appendToRunState({
      consoleErrors: [
        {
          app,
          page: page.url(),
          error: sanitizeText(text),
          severity: msg.type() === 'warning' ? 'warning' : 'error',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });

  page.on('pageerror', (error) => {
    appendToRunState({
      consoleErrors: [
        {
          app,
          page: page.url(),
          error: sanitizeText(error.message),
          severity: 'pageerror',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

export async function login(page: Page, app: AuditApp): Promise<void> {
  if (app === 'buyer') {
    await page.goto(`${qaConfig.buyerUrl}/login`, { waitUntil: 'domcontentloaded' });
    await fillLogin(page, qaConfig.buyer.email, qaConfig.buyer.password, /^login$/i);
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 });
    return;
  }
  if (app === 'merchant') {
    await page.goto(`${qaConfig.merchantUrl}/login`, { waitUntil: 'domcontentloaded' });
    await fillLogin(page, qaConfig.merchant.email, qaConfig.merchant.password, /verify.*sign in|sign in/i);
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 });
    return;
  }
  await page.goto(`${qaConfig.adminUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#email').or(page.locator('input[type="email"]')).first().fill(qaConfig.admin.email);
  await page.locator('#password').or(page.locator('input[type="password"]')).first().fill(qaConfig.admin.password);
  await page.locator('button[type="submit"]').or(page.getByRole('button', { name: /sign in/i })).first().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 });
}

export async function auditRoute(page: Page, app: AuditApp, url: string, source = 'direct'): Promise<RouteAuditEntry> {
  const before = page.url();
  let httpStatus: number | null = null;
  let routeGetsStuck = false;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    httpStatus = response?.status() ?? null;
    await page.waitForLoadState('networkidle', { timeout: 7_000 }).catch(() => {
      routeGetsStuck = true;
    });
  } catch (error) {
    routeGetsStuck = true;
    addIssue({
      title: 'Route navigation failed',
      severity: 'high',
      app,
      url,
      role: app,
      steps: `Navigate from ${source} to ${url}`,
      expected: 'Route loads without Playwright navigation error',
      actual: error instanceof Error ? error.message : String(error),
    });
  }

  const title = await page.title().catch(() => '');
  const header = await firstVisibleText(page, 'h1,h2,[role="heading"]').catch(() => '');
  const uiBackButtonExists = await hasUiBackButton(page);
  const browserBackWorks = await checkBrowserBack(page, before);
  const loadingSkeletonNeverResolves = await hasPersistentLoading(page);
  const emptyStateWithoutExplanation = await hasUnexplainedEmptyState(page);
  const entry: RouteAuditEntry = {
    app,
    url: sanitizeUrl(page.url() || url),
    title,
    header,
    httpStatus,
    consoleErrors: [],
    failedApiRequests: [],
    uiBackButtonExists,
    browserBackWorks,
    routeGetsStuck,
    loadingSkeletonNeverResolves,
    emptyStateWithoutExplanation,
    timestamp: new Date().toISOString(),
  };
  appendToRunState({ routeAudits: [entry] });

  if (isMissingBackButton(page.url(), uiBackButtonExists)) {
    addIssue({
      title: 'Missing UI back button on deep route',
      severity: 'medium',
      app,
      url: page.url(),
      role: app,
      steps: `Open ${page.url()}`,
      expected: 'Deep routes expose a visible Back, previous, return, arrow, or chevron-left control',
      actual: 'No visible UI back control found',
    });
  }
  return entry;
}

export async function clickAndRecord(page: Page, app: AuditApp, label: string, locatorText = label): Promise<void> {
  const sourcePage = page.url();
  try {
    await page.getByText(locatorText, { exact: true }).first().click({ timeout: 5_000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 5_000 }).catch(() => undefined);
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
  } catch (error) {
    appendToRunState({
      brokenNavigation: [
        {
          app,
          sourcePage,
          clickedItem: label,
          result: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }
}

export async function clickFirstVisible(page: Page, selectors: string[], timeout = 5_000): Promise<boolean> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible({ timeout: 750 }).catch(() => false)) {
      await locator.click({ timeout });
      return true;
    }
  }
  return false;
}

export async function addScreenshotIssue(
  page: Page,
  app: AuditApp,
  title: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  actual: string,
): Promise<void> {
  const screenshotPath = await captureScreenshot(page, `${app}-${title}`);
  addIssue({
    title,
    severity,
    app,
    url: page.url(),
    role: app,
    steps: `Open ${page.url()}`,
    expected: 'Page is usable without broken UI state',
    actual,
    screenshotPath,
  });
}

export async function assertNoUiCrash(page: Page, app: AuditApp): Promise<void> {
  const body = await page.locator('body').innerText({ timeout: 5_000 }).catch(() => '');
  const crashed = /application error|something went wrong|unhandled runtime error|this page could not be found|404/i.test(body);
  if (crashed) {
    await addScreenshotIssue(page, app, 'UI crash or error page detected', 'high', body.slice(0, 500));
  }
  expect(body.length).toBeGreaterThan(0);
}

function isAuditedApiUrl(url: string): boolean {
  return url.startsWith(API_ORIGIN) || url.includes('/api/');
}

function requestKey(method: string, url: string): string {
  return `${method}:${url}:${Date.now()}`;
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (/token|password|secret|auth|cookie|session/i.test(key)) {
        parsed.searchParams.set(key, '[redacted]');
      }
    }
    return parsed.toString();
  } catch {
    return sanitizeText(url);
  }
}

function sanitizeText(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .replace(/Token\s+[A-Za-z0-9._-]+/g, 'Token [redacted]')
    .replace(/password["'\s:=]+[^"',\s]+/gi, 'password=[redacted]')
    .slice(0, 1000);
}

function safePayloadShape(postData: string | null): string | undefined {
  if (!postData) return undefined;
  try {
    const parsed = JSON.parse(postData) as Record<string, unknown>;
    const shape: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!SAFE_PAYLOAD_KEYS.includes(key) && /password|token|secret|auth/i.test(key)) continue;
      shape[key] = Array.isArray(value) ? 'array' : typeof value;
    }
    return JSON.stringify(shape);
  } catch {
    return 'non-json';
  }
}

async function safeErrorBody(response: { headers(): Record<string, string>; text(): Promise<string> }): Promise<string | undefined> {
  try {
    const ct = response.headers()['content-type'] ?? '';
    if (!ct.includes('json') && !ct.includes('text')) return undefined;
    return sanitizeText(await response.text());
  } catch {
    return undefined;
  }
}

function isBenignConsoleNoise(text: string): boolean {
  return ['favicon', 'ResizeObserver loop', 'Download the React DevTools', 'Third-party cookie'].some((item) =>
    text.includes(item),
  );
}

async function fillLogin(page: Page, email: string, password: string, buttonName: RegExp): Promise<void> {
  await page.locator('input[type="email"], #email').first().fill(email);
  await page.locator('input[type="password"], #password').first().fill(password);
  await page.getByRole('button', { name: buttonName }).or(page.locator('button[type="submit"]')).first().click();
}

async function firstVisibleText(page: Page, selector: string): Promise<string> {
  const locators = await page.locator(selector).all();
  for (const locator of locators.slice(0, 8)) {
    if (await locator.isVisible().catch(() => false)) {
      return (await locator.innerText().catch(() => '')).trim();
    }
  }
  return '';
}

async function hasUiBackButton(page: Page): Promise<boolean> {
  const textBack = page.getByRole('button', { name: /back|go back|return|previous|←|‹/i })
    .or(page.getByRole('link', { name: /back|go back|return|previous|←|‹/i }));
  if (await textBack.first().isVisible({ timeout: 500 }).catch(() => false)) return true;
  const iconBack = page.locator('[aria-label*="back" i], [data-icon*="chevron-left" i], .lucide-chevron-left').first();
  return iconBack.isVisible({ timeout: 500 }).catch(() => false);
}

async function checkBrowserBack(page: Page, before: string): Promise<boolean> {
  const current = page.url();
  if (!before || before === current || before === 'about:blank') return true;
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 7_000 }).catch(() => null);
  const worked = page.url() !== current;
  await page.goto(current, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
  return worked;
}

async function hasPersistentLoading(page: Page): Promise<boolean> {
  await page.waitForTimeout(500);
  const loading = page.locator('text=/loading|please wait|skeleton/i').first();
  return loading.isVisible({ timeout: 500 }).catch(() => false);
}

async function hasUnexplainedEmptyState(page: Page): Promise<boolean> {
  const body = await page.locator('body').innerText({ timeout: 3_000 }).catch(() => '');
  const hasEmpty = /no data|no results|empty|nothing here|no orders|no products/i.test(body);
  const explained = /try|create|add|adjust|change filter|check back|start/i.test(body);
  return hasEmpty && !explained;
}

function isMissingBackButton(rawUrl: string, hasBack: boolean): boolean {
  if (hasBack) return false;
  try {
    const url = new URL(rawUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    const topLevel = new Set(['dashboard', 'orders', 'products', 'stores', 'inventory', 'analytics', 'reviews', 'promotions']);
    return segments.length > 1 && !topLevel.has(segments[0]);
  } catch {
    return false;
  }
}
