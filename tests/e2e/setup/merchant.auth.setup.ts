import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAsMerchant } from '../helpers/auth';

const authFile = path.resolve(process.cwd(), 'qa-reports', '.auth', 'merchant.json');

setup('authenticate merchant', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await loginAsMerchant(page);
  await page.context().storageState({ path: authFile });
});
