import { test } from '@playwright/test';
import { addIssue, createState, ensureQaDirs, writeQaReports } from './helpers/qa-report';
import { appInfo, assertNoP0, contextForApp, crawlApp, qaApps, runApiChecks, runRbacChecks } from './helpers/qa-utils';

test.describe.configure({ mode: 'serial' });

test.describe('JebDekho production-safe QA audit', () => {
  test('crawls buyer, merchant, admin, checks API, and writes QA reports', async ({ browser, request }) => {
    ensureQaDirs();
    const state = createState(appInfo());
    const contexts = [];

    try {
      await runApiChecks(request, state);

      for (const app of qaApps) {
        const context = await contextForApp(browser, app, state);
        contexts.push(context);
        await crawlApp(context, app, state);
      }

      const publicContext = await browser.newContext();
      contexts.push(publicContext);
      await runRbacChecks(publicContext, state);
    } catch (error) {
      addIssue(state, {
        severity: 'P0',
        app: 'framework',
        url: 'local-playwright-run',
        title: 'Production QA framework error',
        message: error instanceof Error ? error.stack ?? error.message : String(error),
        steps: ['Run pnpm qa:e2e', 'Review framework-level exception'],
      });
    } finally {
      writeQaReports(state);
      await Promise.all(contexts.map((context) => context.close().catch(() => undefined)));
    }

    await assertNoP0(state);
  });
});
