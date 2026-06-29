import type { Locator, Page } from '@playwright/test';
import { appendToRunState } from './report-writer';

export async function safeClick(
  locator: Locator,
  opts: { app: string; sourcePage: string; label: string; timeout?: number },
): Promise<boolean> {
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: opts.timeout ?? 10_000 });
    if (!(await locator.isVisible({ timeout: 3_000 }).catch(() => false))) {
      appendToRunState({
        brokenNavigation: [
          {
            app: opts.app,
            sourcePage: opts.sourcePage,
            clickedItem: opts.label,
            result: 'Element not visible',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      return false;
    }
    await locator.click({ timeout: opts.timeout ?? 10_000 });
    return true;
  } catch (err) {
    appendToRunState({
      brokenNavigation: [
        {
          app: opts.app,
          sourcePage: opts.sourcePage,
          clickedItem: opts.label,
          result: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        },
      ],
    });
    return false;
  }
}

export async function safeGoto(page: Page, url: string): Promise<number | null> {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  return response?.status() ?? null;
}

export async function assertNoServerError(page: Page): Promise<void> {
  const title = await page.title();
  const body = await page.locator('body').innerText().catch(() => '');
  const isError =
    title.includes('404') ||
    title.includes('500') ||
    /page not found|internal server error|something went wrong/i.test(body);
  if (isError) {
    appendToRunState({
      issues: [
        {
          id: `issue-server-${Date.now()}`,
          title: 'Server error page detected',
          severity: 'high',
          app: 'unknown',
          url: page.url(),
          role: 'anonymous',
          steps: 'Navigate to page',
          expected: 'Valid page content',
          actual: `Error page: ${title}`,
        },
      ],
    });
  }
}

export async function dismissOverlays(page: Page): Promise<void> {
  const closeButtons = [
    page.getByRole('button', { name: /close|dismiss|got it|accept|not now/i }),
    page.locator('[aria-label="Close"]'),
  ];
  for (const btn of closeButtons) {
    if (await btn.first().isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.first().click({ timeout: 2_000 }).catch(() => undefined);
    }
  }
}
