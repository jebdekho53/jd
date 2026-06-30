import { test as setup } from '@playwright/test';
import { loginAsBuyer } from '../helpers/auth';
import { authStatePath, ensureAuthDir } from '../helpers/storage-state';

setup('authenticate buyer', async ({ page }) => {
  ensureAuthDir();
  await loginAsBuyer(page);
  await page.context().storageState({ path: authStatePath('buyer') });
});
