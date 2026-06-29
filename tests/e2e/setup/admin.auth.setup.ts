import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAsAdmin } from '../helpers/auth';

const authFile = path.resolve(process.cwd(), 'qa-reports', '.auth', 'admin.json');

setup('authenticate admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await loginAsAdmin(page);
  await page.context().storageState({ path: authFile });
});
