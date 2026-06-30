import { test as setup } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';
import { authStatePath, ensureAuthDir } from '../helpers/storage-state';

setup('authenticate admin', async ({ page }) => {
  ensureAuthDir();
  await loginAsAdmin(page);
  await page.context().storageState({ path: authStatePath('admin') });
});
