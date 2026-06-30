import { test, expect } from '@playwright/test';
import { qaConfig } from './test-config';
import { attachProductionAudit, auditRoute, login, type AuditApp } from './helpers/production-audit';
import { appendToRunState } from './helpers/report-writer';

const TARGETS: Array<{ app: AuditApp; url: string; auth?: boolean }> = [
  { app: 'buyer', url: qaConfig.buyerUrl },
  { app: 'buyer', url: `${qaConfig.buyerUrl}/stores` },
  { app: 'buyer', url: `${qaConfig.buyerUrl}/cart`, auth: true },
  { app: 'merchant', url: `${qaConfig.merchantUrl}/dashboard`, auth: true },
  { app: 'merchant', url: `${qaConfig.merchantUrl}/orders`, auth: true },
  { app: 'admin', url: `${qaConfig.adminUrl}/dashboard`, auth: true },
  { app: 'admin', url: `${qaConfig.adminUrl}/logistics`, auth: true },
];

test.describe('Production API and network audit', () => {
  for (const target of TARGETS) {
    test(`${target.app} network: ${target.url}`, async ({ page }, testInfo) => {
      attachProductionAudit(page, target.app, testInfo);
      if (target.auth) await login(page, target.app);
      await auditRoute(page, target.app, target.url, 'api network audit');
      await expect(page.locator('body')).not.toBeEmpty();
      appendToRunState({
        appResults: [
          {
            app: target.app,
            status: 'PASS',
            notes: [`Captured API/fetch/XHR traffic for ${target.url}`],
            timestamp: new Date().toISOString(),
          },
        ],
      });
    });
  }
});
