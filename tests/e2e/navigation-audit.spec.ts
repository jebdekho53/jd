import { test } from '@playwright/test';
import { qaConfig } from './test-config';
import {
  assertNoUiCrash,
  attachProductionAudit,
  auditRoute,
  clickAndRecord,
  login,
  type AuditApp,
} from './helpers/production-audit';

const APPS: Array<{ app: AuditApp; base: string; start: string; authenticated: boolean }> = [
  { app: 'buyer', base: qaConfig.buyerUrl, start: '/', authenticated: false },
  { app: 'merchant', base: qaConfig.merchantUrl, start: '/dashboard', authenticated: true },
  { app: 'admin', base: qaConfig.adminUrl, start: '/dashboard', authenticated: true },
];

test.describe('Production navigation crawl audit', () => {
  for (const target of APPS) {
    test(`${target.app} internal links and buttons`, async ({ page }, testInfo) => {
      test.setTimeout(180_000);
      attachProductionAudit(page, target.app, testInfo);
      if (target.authenticated) await login(page, target.app);
      await auditRoute(page, target.app, `${target.base}${target.start}`, 'navigation crawl start');
      await assertNoUiCrash(page, target.app);

      const links = await page.locator('a[href^="/"], a[href^="' + target.base + '"]').evaluateAll((nodes) =>
        [...new Set(nodes.map((node) => (node as HTMLAnchorElement).href).filter(Boolean))].slice(0, 20),
      );
      for (const href of links) {
        await auditRoute(page, target.app, href, 'navigation crawl link');
        await assertNoUiCrash(page, target.app);
      }

      await page.goto(`${target.base}${target.start}`, { waitUntil: 'domcontentloaded' });
      const buttonLabels = await page.locator('button, [role="button"]').evaluateAll((nodes) =>
        [...new Set(nodes.map((node) => (node.textContent ?? node.getAttribute('aria-label') ?? '').trim()).filter(Boolean))].slice(0, 20),
      );
      for (const label of buttonLabels) {
        await clickAndRecord(page, target.app, label);
      }
    });
  }
});
