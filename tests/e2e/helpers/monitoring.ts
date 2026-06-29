import type { Page } from '@playwright/test';
import * as path from 'path';
import { appendToRunState } from './report-writer';
import { qaConfig } from '../test-config';

export interface MonitoringContext {
  app: string;
  action: string;
}

export function attachPageMonitoring(page: Page, ctx: MonitoringContext): void {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type !== 'error' && type !== 'warning') return;
    const text = msg.text();
    if (isBenignConsoleNoise(text)) return;
    appendToRunState({
      consoleErrors: [
        {
          app: ctx.app,
          page: page.url(),
          error: text,
          severity: type === 'warning' ? 'warning' : 'error',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });

  page.on('pageerror', (error) => {
    appendToRunState({
      consoleErrors: [
        {
          app: ctx.app,
          page: page.url(),
          error: error.message,
          severity: 'pageerror',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });

  page.on('response', async (response) => {
    const status = response.status();
    if (status < 400) return;
    const url = response.url();
    if (!isApiUrl(url)) return;
    let bodySnippet = '';
    try {
      const ct = response.headers()['content-type'] ?? '';
      if (ct.includes('json') || ct.includes('text')) {
        const text = await response.text();
        bodySnippet = text.slice(0, 300);
      }
    } catch {
      // response body may be unavailable
    }
    appendToRunState({
      networkErrors: [
        {
          app: ctx.app,
          action: ctx.action,
          method: response.request().method(),
          endpoint: url,
          status,
          error: bodySnippet || response.statusText(),
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

function isApiUrl(url: string): boolean {
  return (
    url.includes('api.jebdekho.com') ||
    url.includes('/api/') ||
    url.includes('/api/v1/')
  );
}

function isBenignConsoleNoise(text: string): boolean {
  const ignore = [
    'Download the React DevTools',
    'favicon',
    'ResizeObserver loop',
    'Third-party cookie',
    'Manifest:',
  ];
  return ignore.some((s) => text.includes(s));
}

export async function captureScreenshot(page: Page, name: string): Promise<string> {
  const dir = path.resolve(process.cwd(), qaConfig.qaReportsDir, 'screenshots');
  const safe = name.replace(/[^a-z0-9-_]/gi, '_').slice(0, 80);
  const file = path.join(dir, `${safe}-${Date.now()}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

export async function getStorageKeySummary(page: Page): Promise<Record<string, string[]>> {
  return page.evaluate(() => {
    const summarize = (storage: Storage) =>
      Object.keys(storage).map((k) => {
        const v = storage.getItem(k) ?? '';
        const masked = v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-4)}` : '[redacted]';
        return `${k}=${masked}`;
      });
    return {
      localStorage: summarize(window.localStorage),
      sessionStorage: summarize(window.sessionStorage),
    };
  });
}

export async function assertNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  if (overflow) {
    appendToRunState({
      issues: [
        {
          id: `issue-scroll-${Date.now()}`,
          title: 'Horizontal scroll detected',
          severity: 'medium',
          app: 'buyer',
          url: page.url(),
          role: 'anonymous',
          steps: 'Load page on mobile viewport',
          expected: 'No horizontal overflow',
          actual: 'Page scrolls horizontally',
        },
      ],
    });
  }
}
