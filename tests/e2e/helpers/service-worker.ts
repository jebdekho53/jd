import type { Page } from '@playwright/test';
import { qaConfig } from '../test-config';

export async function resetServiceWorkerAndCaches(page: Page, origin = qaConfig.buyerUrl): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('jebdekho-e2e-disable-sw', '1');
  });

  await page.goto(`${origin}/?e2eDisableSw=1`, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
  await page.evaluate(async () => {
    window.localStorage.setItem('jebdekho-e2e-disable-sw', '1');
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  }).catch(() => undefined);
}
