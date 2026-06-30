import { test as setup } from '@playwright/test';
import { loginAsMerchant } from '../helpers/auth';
import { authStatePath, ensureAuthDir } from '../helpers/storage-state';

setup('authenticate merchant', async ({ page }) => {
  ensureAuthDir();
  await loginAsMerchant(page);
  await page.context().storageState({ path: authStatePath('merchant') });
});
