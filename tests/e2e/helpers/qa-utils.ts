import { expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { addIssue, addNetworkFailure, addPageVisit, addSkippedAction, ensureQaDirs, sanitizeFileName, type QaReportState } from './qa-report';

export type AppName = 'buyer' | 'merchant' | 'admin';

export interface QaAppConfig {
  name: AppName;
  label: string;
  baseUrl: string;
  email?: string;
  password?: string;
  maxPages: number;
  loginSupported: boolean;
  appDir: string;
}

export const qaApps: QaAppConfig[] = [
  { name: 'buyer', label: 'Buyer', baseUrl: envUrl('QA_BUYER_URL', 'https://jebdekho.com'), email: process.env.QA_BUYER_EMAIL, password: process.env.QA_BUYER_PASSWORD, maxPages: 12, loginSupported: true, appDir: 'apps/buyer-web/app' },
  { name: 'merchant', label: 'Merchant', baseUrl: envUrl('QA_MERCHANT_URL', 'https://merchant.jebdekho.com'), email: process.env.QA_MERCHANT_EMAIL, password: process.env.QA_MERCHANT_PASSWORD, maxPages: 10, loginSupported: true, appDir: 'apps/merchant-web/app' },
  { name: 'admin', label: 'Admin', baseUrl: envUrl('QA_ADMIN_URL', 'https://admin.jebdekho.com'), email: process.env.QA_ADMIN_EMAIL, password: process.env.QA_ADMIN_PASSWORD, maxPages: 10, loginSupported: true, appDir: 'apps/admin-web/app' },
];

const destructiveWords = /delete|remove|cancel|refund|approve|reject|logout|sign out|place order|pay|payment|confirm|submit order|clear cart|deactivate|block|suspend|ban|ship|dispatch|assign|accept|complete|mark delivered|mark picked|irreversible|permanently/i;
const placeholderWords = /lorem ipsum|coming soon|under construction|\bTODO\b|\bFIXME\b|placeholder|dummy|mock|sample data|test product|test store|undefined|null|NaN|\[object Object\]/i;
const lowValueLink = /^(click here|here|read more|learn more)$/i;

function envUrl(name: string, fallback: string): string {
  return (process.env[name] ?? fallback).replace(/\/$/, '');
}

export function appInfo() {
  return qaApps.map((app) => ({ name: app.name, label: app.label, url: app.baseUrl, maxPages: app.maxPages, loginSupported: app.loginSupported }));
}

export function attachMonitors(page: Page, state: QaReportState, app: QaAppConfig): void {
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    addIssue(state, { severity: 'P1', app: app.name, url: page.url(), title: 'Console error', message: message.text().slice(0, 500), steps: ['Open page', 'Observe browser console'] });
  });
  page.on('pageerror', (error) => {
    addIssue(state, { severity: 'P0', app: app.name, url: page.url(), title: 'JavaScript exception', message: error.message, steps: ['Open page', 'Observe uncaught page error'] });
  });
  page.on('requestfailed', (request) => {
    addNetworkFailure(state, { app: app.name, pageUrl: page.url(), method: request.method(), url: request.url(), error: request.failure()?.errorText });
  });
  page.on('response', async (response) => {
    const status = response.status();
    if (status < 400) return;
    const url = response.url();
    addNetworkFailure(state, { app: app.name, pageUrl: page.url(), method: response.request().method(), url, status, error: response.statusText() });
    const publicPage = app.name === 'buyer' && sameOrigin(url, app.baseUrl);
    const severity = status >= 500 ? 'P0' : status === 404 || (publicPage && [401, 403].includes(status)) ? 'P1' : 'P2';
    addIssue(state, { severity, app: app.name, url: page.url(), title: `HTTP ${status} response`, message: `${response.request().method()} ${url}`, steps: ['Open page', 'Review failed network response'], network: { method: response.request().method(), url, status } });
  });
}

export async function contextForApp(browser: Browser, app: QaAppConfig, state: QaReportState): Promise<BrowserContext> {
  ensureQaDirs();
  const storage = path.resolve('qa-reports/storage', `${app.name}.json`);
  const context = fs.existsSync(storage) ? await browser.newContext({ storageState: storage }) : await browser.newContext();
  const page = await context.newPage();
  attachMonitors(page, state, app);
  await loginIfNeeded(page, app, state, storage);
  await page.close();
  return context;
}

export async function loginIfNeeded(page: Page, app: QaAppConfig, state: QaReportState, storagePath: string): Promise<void> {
  if (!app.loginSupported) return;
  if (!app.email || !app.password) {
    addIssue(state, { severity: 'P1', app: app.name, url: app.baseUrl, title: 'Credentials missing', message: `Set ${app.name.toUpperCase()} QA email/password env vars to enable authenticated crawl.`, steps: ['Create .env.qa from .env.qa.example', 'Provide role-specific credentials'] });
    return;
  }
  try {
    await page.goto(`${app.baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    if (!(await looksLikeLogin(page))) return;
    await page.locator('input[type="email"], input[name*="email" i], input[placeholder*="email" i]').first().fill(app.email);
    await page.locator('input[type="password"], input[name*="password" i], input[placeholder*="password" i]').first().fill(app.password);
    await page.getByRole('button', { name: /login|log in|sign in|continue|submit/i }).or(page.locator('button[type="submit"]')).first().click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    if (await looksLikeLogin(page)) {
      addIssue(state, { severity: 'P1', app: app.name, url: page.url(), title: 'Login did not complete', message: 'Login form still appears after submitting test credentials.', steps: ['Navigate to login', 'Fill env credentials', 'Submit login form'] });
      return;
    }
    await page.context().storageState({ path: storagePath });
  } catch (error) {
    addIssue(state, { severity: 'P1', app: app.name, url: page.url() || app.baseUrl, title: 'Login failed', message: String(error), steps: ['Navigate to login', 'Attempt generic login flow'] });
  }
}

export async function crawlApp(context: BrowserContext, app: QaAppConfig, state: QaReportState): Promise<void> {
  const page = await context.newPage();
  attachMonitors(page, state, app);
  const queue: Array<{ url: string; depth: number; source: string }> = [{ url: app.baseUrl, depth: 0, source: 'home' }];
  const seen = new Set<string>();
  const repoRoutes = discoverRepoRoutes(app);

  for (const route of repoRoutes.slice(0, 8)) queue.push({ url: new URL(route, app.baseUrl).toString(), depth: 1, source: 'repo route discovery' });
  while (queue.length && seen.size < app.maxPages) {
    const next = queue.shift();
    if (!next) break;
    const url = normalizeUrl(next.url);
    if (!url || seen.has(url) || !sameOrigin(url, app.baseUrl) || isUnsafeUrl(url)) continue;
    seen.add(url);
    const response = await gotoSafely(page, app, state, url, next.source);
    await auditPage(page, app, state, response?.status() ?? null);
    await safeClickVisibleControls(page, app, state);
    const links = await collectLinks(page, app.baseUrl);
    for (const link of links) if (!seen.has(link) && queue.length < app.maxPages * 2) queue.push({ url: link, depth: next.depth + 1, source: page.url() });
  }

  for (const route of repoRoutes) {
    const full = new URL(route, app.baseUrl).toString();
    if (!seen.has(normalizeUrl(full) ?? full)) {
      addIssue(state, { severity: 'P2', app: app.name, url: full, title: 'Disconnected route suspect', message: 'Route exists in the Next.js app tree but was not reached through visible same-origin navigation during the crawl.', steps: ['Inspect repo app routes', 'Crawl visible navigation', 'Compare discovered route list'] });
    }
  }
  await page.close();
}

async function gotoSafely(page: Page, app: QaAppConfig, state: QaReportState, url: string, source: string) {
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1_200);
    addPageVisit(state, { app: app.name, url: page.url(), title: await page.title(), status: response?.status() ?? null });
    await screenshot(page, app, state, 'key-page');
    if (!response || response.status() >= 500) addIssue(state, { severity: 'P0', app: app.name, url, title: 'Navigation failed or server error', message: `Source: ${source}; status: ${response?.status() ?? 'no response'}`, steps: ['Navigate to URL', 'Wait for DOM content loaded'] });
    if (response?.status() === 404) addIssue(state, { severity: 'P1', app: app.name, url, title: 'Page returned 404', message: 'A crawled or discovered route returned Not Found.', steps: ['Open source page', 'Follow link or route'] });
    return response;
  } catch (error) {
    addIssue(state, { severity: 'P1', app: app.name, url, title: 'Long-running navigation failure', message: String(error), steps: ['Navigate to URL', 'Wait for DOM content loaded'] });
    return null;
  }
}

async function auditPage(page: Page, app: QaAppConfig, state: QaReportState, status: number | null): Promise<void> {
  const url = page.url();
  const body = (await page.locator('body').innerText({ timeout: 5_000 }).catch(() => '')).trim();
  const title = await page.title().catch(() => '');
  if (!title) addIssue(state, { severity: 'P2', app: app.name, url, title: 'Missing page title', message: 'Document title is empty.', steps: ['Open page', 'Inspect document title'] });
  if (!body || body.length < 30) addIssue(state, { severity: 'P1', app: app.name, url, title: 'Empty page suspect', message: `Body text length is ${body.length}; status ${status ?? 'unknown'}.`, steps: ['Open page', 'Inspect visible body content'] });
  if (placeholderWords.test(body)) addIssue(state, { severity: /undefined|null|NaN|\[object Object\]|coming soon|under construction|TODO|FIXME|lorem/i.test(body) ? 'P1' : 'P2', app: app.name, url, title: 'Placeholder or mock content', message: firstMatch(body, placeholderWords), steps: ['Open page', 'Scan visible copy for placeholder terms'] });
  await scanImages(page, app, state);
  await scanAccessibility(page, app, state);
  await scanForms(page, app, state);
  await scanMetadata(page, app, state);
  await scanPersistentLoaders(page, app, state);
  await scanDisconnectedLinks(page, app, state);
}

async function scanImages(page: Page, app: QaAppConfig, state: QaReportState): Promise<void> {
  const images = await page.locator('img').evaluateAll((imgs) => imgs.map((img) => ({ src: (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src, alt: img.getAttribute('alt'), broken: (img as HTMLImageElement).naturalWidth === 0 || (img as HTMLImageElement).naturalHeight === 0 })));
  for (const image of images) {
    if (image.broken) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Broken image', message: image.src, steps: ['Open page', 'Evaluate image natural dimensions'], selector: `img[src="${image.src}"]` });
    if (image.alt === null || image.alt.trim() === '') addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Image missing alt text', message: image.src, steps: ['Open page', 'Inspect image alt attributes'] });
  }
}

async function scanAccessibility(page: Page, app: QaAppConfig, state: QaReportState): Promise<void> {
  const result = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id).filter(Boolean);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const unlabeledButtons = Array.from(document.querySelectorAll('button,[role="button"]')).filter((el) => !(el.textContent || el.getAttribute('aria-label') || el.getAttribute('title'))?.trim()).length;
    const unlabeledInputs = Array.from(document.querySelectorAll('input,select,textarea')).filter((el) => !(el.getAttribute('aria-label') || el.getAttribute('placeholder') || document.querySelector(`label[for="${el.id}"]`) || el.closest('label'))).length;
    const h1Count = document.querySelectorAll('h1').length;
    const weakLinks = Array.from(document.querySelectorAll('a')).filter((a) => /^(click here|here|read more|learn more)$/i.test((a.textContent || '').trim())).map((a) => (a.textContent || '').trim());
    return { duplicateIds: [...new Set(duplicateIds)], unlabeledButtons, unlabeledInputs, h1Count, weakLinks };
  });
  if (result.duplicateIds.length) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Duplicate IDs', message: result.duplicateIds.join(', '), steps: ['Open page', 'Scan DOM IDs'] });
  if (result.unlabeledButtons) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Buttons without accessible names', message: `${result.unlabeledButtons} unnamed buttons found.`, steps: ['Open page', 'Inspect button text and aria-labels'] });
  if (result.unlabeledInputs) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Inputs without labels', message: `${result.unlabeledInputs} unlabeled fields found.`, steps: ['Open page', 'Inspect form controls'] });
  if (result.h1Count === 0) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Missing h1', message: 'No h1 found on important page.', steps: ['Open page', 'Inspect headings'] });
  if (result.h1Count > 1) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Multiple h1 elements', message: `${result.h1Count} h1 elements found.`, steps: ['Open page', 'Inspect headings'] });
  for (const text of result.weakLinks.filter((x) => lowValueLink.test(x))) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Low-value link text', message: text, steps: ['Open page', 'Inspect visible links'] });
}

async function scanForms(page: Page, app: QaAppConfig, state: QaReportState): Promise<void> {
  const forms = await page.locator('form').evaluateAll((forms) => forms.map((form) => ({ inputs: form.querySelectorAll('input,select,textarea').length, submits: form.querySelectorAll('button[type="submit"],input[type="submit"]').length, action: form.getAttribute('action'), disabledSubmit: !!form.querySelector('button[type="submit"]:disabled,input[type="submit"]:disabled'), requiredNoLabel: Array.from(form.querySelectorAll('input[required],select[required],textarea[required]')).filter((el) => !(el.getAttribute('aria-label') || el.getAttribute('placeholder') || document.querySelector(`label[for="${el.id}"]`) || el.closest('label'))).length })));
  for (const form of forms) {
    if (form.requiredNoLabel) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Required fields without labels', message: `${form.requiredNoLabel} required fields lack visible or accessible labels.`, steps: ['Open page', 'Inspect forms without submitting'] });
    if (form.inputs === 0 && form.submits > 0) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Submit button without inputs', message: 'A form has submit controls but no visible fields.', steps: ['Open page', 'Inspect form controls'] });
    if (form.inputs > 0 && form.disabledSubmit) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Disabled important submit', message: 'A form submit button is disabled during static scan.', steps: ['Open page', 'Inspect form submit state'] });
  }
}

async function scanMetadata(page: Page, app: QaAppConfig, state: QaReportState): Promise<void> {
  if (app.name !== 'buyer') return;
  const meta = await page.evaluate(() => ({ description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '', canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '', robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '' }));
  if (!meta.description.trim()) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Missing meta description', message: 'Buyer public page has no meta description.', steps: ['Open buyer page', 'Inspect SEO metadata'] });
  if (!meta.canonical.trim()) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Missing canonical', message: 'Buyer public page has no canonical link.', steps: ['Open buyer page', 'Inspect SEO metadata'] });
  if (/noindex/i.test(meta.robots)) addIssue(state, { severity: 'P1', app: app.name, url: page.url(), title: 'Unexpected noindex', message: `robots=${meta.robots}`, steps: ['Open buyer page', 'Inspect robots meta'] });
}

async function scanPersistentLoaders(page: Page, app: QaAppConfig, state: QaReportState): Promise<void> {
  const loader = page.locator('[aria-busy="true"], [role="progressbar"], .spinner, .skeleton, text=/loading/i').first();
  if (!(await loader.isVisible({ timeout: 500 }).catch(() => false))) return;
  await page.waitForTimeout(5_500);
  const body = await page.locator('body').innerText().catch(() => '');
  if (await loader.isVisible().catch(() => false) && body.length < 500) addIssue(state, { severity: 'P1', app: app.name, url: page.url(), title: 'Infinite loader suspect', message: 'Loader remained visible while page content stayed sparse.', steps: ['Open page', 'Wait 5 seconds', 'Check loader visibility and body content'] });
}

async function scanDisconnectedLinks(page: Page, app: QaAppConfig, state: QaReportState): Promise<void> {
  const badLinks = await page.locator('a').evaluateAll((links) => links.map((a) => ({ href: a.getAttribute('href') ?? '', text: (a.textContent ?? '').trim() })).filter((a) => ['', '#', 'javascript:void(0)'].includes(a.href)));
  for (const link of badLinks) addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Nav link goes nowhere', message: `${link.text || '(no text)'} -> ${link.href || '(empty href)'}`, steps: ['Open page', 'Inspect anchors'] });
}

async function collectLinks(page: Page, baseUrl: string): Promise<string[]> {
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((a) => (a as HTMLAnchorElement).href));
  return [...new Set(hrefs.map(normalizeUrl).filter((url): url is string => !!url && sameOrigin(url, baseUrl) && !isUnsafeUrl(url)))];
}

async function safeClickVisibleControls(page: Page, app: QaAppConfig, state: QaReportState): Promise<void> {
  const controls = page.locator('button, [role="button"], a[role="button"], [role="menuitem"], [role="tab"], summary, [aria-haspopup="dialog"], [aria-haspopup="menu"]');
  const count = Math.min(await controls.count(), 12);
  for (let i = 0; i < count; i += 1) {
    const control = controls.nth(i);
    if (!(await control.isVisible().catch(() => false))) continue;
    const label = ((await control.innerText().catch(() => '')) || (await control.getAttribute('aria-label').catch(() => '')) || (await control.getAttribute('data-testid').catch(() => '')) || '').trim();
    const href = await control.getAttribute('href').catch(() => '');
    const descriptor = `${label} ${href ?? ''}`;
    if (destructiveWords.test(descriptor)) {
      addSkippedAction(state, { app: app.name, url: page.url(), label: label || href || 'unlabeled control', selector: await selectorFor(control), reason: 'Matched destructive production action denylist' });
      continue;
    }
    const beforeUrl = page.url();
    const beforeDom = await page.locator('body').innerText().catch(() => '');
    try {
      await control.click({ timeout: 4_000 });
      await page.waitForTimeout(800);
      const afterUrl = page.url();
      const afterDom = await page.locator('body').innerText().catch(() => '');
      const modalOpened = await page.locator('[role="dialog"], [role="menu"], [role="tabpanel"]').first().isVisible({ timeout: 500 }).catch(() => false);
      if (beforeUrl === afterUrl && beforeDom === afterDom && !modalOpened) addIssue(state, { severity: 'P2', app: app.name, url: beforeUrl, title: 'Possible no-op button', message: label || 'Unnamed control did not change URL, DOM, modal, menu, or tab state.', steps: ['Open page', 'Click visible non-destructive interactive control'], selector: await selectorFor(control) });
      if (afterUrl !== beforeUrl && sameOrigin(afterUrl, app.baseUrl)) await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10_000 }).catch(() => undefined);
    } catch (error) {
      addIssue(state, { severity: 'P2', app: app.name, url: page.url(), title: 'Safe click failed', message: String(error), steps: ['Open page', 'Click visible non-destructive control'], selector: await selectorFor(control) });
    }
  }
}

export async function runApiChecks(request: APIRequestContext, state: QaReportState): Promise<void> {
  const apiUrl = envUrl('QA_API_URL', 'https://api.jebdekho.com');
  for (const endpoint of ['/', '/health', '/api/health', '/docs', '/swagger']) {
    const url = `${apiUrl}${endpoint === '/' ? '' : endpoint}`;
    try {
      const response = await request.get(url, { timeout: 20_000 });
      const status = response.status();
      const contentType = response.headers()['content-type'] ?? '';
      if (status >= 500) addIssue(state, { severity: 'P0', app: 'api', url, title: 'API 500 response', message: `${status} ${response.statusText()}`, steps: ['Send safe GET request to API endpoint'], network: { method: 'GET', url, status } });
      if (endpoint === '/' && !response.ok()) addIssue(state, { severity: 'P0', app: 'api', url, title: 'API base unavailable', message: `${status} ${response.statusText()}`, steps: ['Send safe GET request to API base'], network: { method: 'GET', url, status } });
      if (status >= 400 && status !== 404) addNetworkFailure(state, { app: 'api', pageUrl: apiUrl, method: 'GET', url, status, error: response.statusText() });
      if (status >= 400 && /text\/html/i.test(contentType)) addIssue(state, { severity: 'P1', app: 'api', url, title: 'Unexpected HTML error page', message: `Endpoint returned ${status} with ${contentType}.`, steps: ['Send safe GET request', 'Inspect response content type'] });
    } catch (error) {
      addIssue(state, { severity: 'P0', app: 'api', url, title: 'API request failed', message: String(error), steps: ['Send safe GET request to API endpoint'] });
    }
  }
}

export async function runRbacChecks(context: BrowserContext, state: QaReportState): Promise<void> {
  const checks = [
    { role: 'buyer', app: qaApps[0], target: `${qaApps[1].baseUrl}/dashboard`, title: 'Buyer should not access merchant dashboard' },
    { role: 'buyer', app: qaApps[0], target: `${qaApps[2].baseUrl}/dashboard`, title: 'Buyer should not access admin dashboard' },
    { role: 'merchant', app: qaApps[1], target: `${qaApps[2].baseUrl}/dashboard`, title: 'Merchant should not access admin dashboard' },
    { role: 'public', app: qaApps[2], target: `${qaApps[2].baseUrl}/dashboard`, title: 'Admin protected route should require auth' },
  ];
  const page = await context.newPage();
  for (const check of checks) {
    const response = await page.goto(check.target, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const text = await page.locator('body').innerText().catch(() => '');
    const protectedLikely = [401, 403, 404].includes(response?.status() ?? 0) || /login|sign in|unauthorized|forbidden|access denied/i.test(`${page.url()} ${text}`);
    if (!protectedLikely) addIssue(state, { severity: 'P1', app: check.app.name, url: check.target, title: check.title, message: 'Protected cross-role route appeared reachable without an obvious auth/deny response.', steps: ['Visit known cross-role route', 'Check status and visible denial/login text'] });
  }
  await page.close();
}

function discoverRepoRoutes(app: QaAppConfig): string[] {
  const root = path.resolve(process.cwd(), app.appDir);
  if (!fs.existsSync(root)) return [];
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.') || ['node_modules', '.next'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      if (entry.isFile() && /^(page|route)\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        const rel = path.relative(root, dir).split(path.sep).filter(Boolean).filter((part) => !part.startsWith('(') && !part.includes('['));
        routes.push(`/${rel.join('/')}`);
      }
    }
  };
  walk(root);
  return [...new Set(routes)].filter((route) => !route.includes('/api')).slice(0, 40);
}

async function looksLikeLogin(page: Page): Promise<boolean> {
  return (await page.locator('input[type="password"], input[name*="password" i]').count()) > 0;
}

function normalizeUrl(input: string | null): string | null {
  if (!input || /^(mailto|tel|blob|javascript):/i.test(input)) return null;
  try {
    const url = new URL(input);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function sameOrigin(input: string, base: string): boolean {
  try {
    return new URL(input).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

function isUnsafeUrl(url: string): boolean {
  return destructiveWords.test(new URL(url).pathname);
}

function firstMatch(text: string, pattern: RegExp): string {
  return text.match(pattern)?.[0] ?? 'matched placeholder pattern';
}

async function screenshot(page: Page, app: QaAppConfig, _state: QaReportState, prefix: string): Promise<string | undefined> {
  try {
    const file = path.resolve('qa-reports/screenshots', `${app.name}-${prefix}-${sanitizeFileName(page.url())}.png`);
    await page.screenshot({ path: file, fullPage: true });
    return file;
  } catch {
    return undefined;
  }
}

async function selectorFor(locator: ReturnType<Page['locator']>): Promise<string | undefined> {
  return locator.evaluate((el) => {
    if (el.id) return `#${el.id}`;
    const testId = el.getAttribute('data-testid');
    if (testId) return `[data-testid="${testId}"]`;
    return el.tagName.toLowerCase();
  }).catch(() => undefined);
}

export async function assertNoP0(state: QaReportState): Promise<void> {
  expect.soft(state.issues.filter((issue) => issue.severity === 'P0'), 'Production QA P0 issues').toHaveLength(0);
}
