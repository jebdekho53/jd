import { test as base } from '@playwright/test';
import { attachPageMonitoring } from '../helpers/monitoring';
import { dismissOverlays } from '../helpers/safe-click';

type QaFixtures = {
  app: string;
  monitoredPage: void;
};

export const test = base.extend<QaFixtures>({
  app: ['buyer', { option: true }],
  monitoredPage: [
    async ({ page, app }, use) => {
      attachPageMonitoring(page, { app, action: 'test-run' });
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';

export async function preparePage(page: import('@playwright/test').Page): Promise<void> {
  await dismissOverlays(page);
}
