import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.e2e.local') });
dotenv.config({ path: path.resolve(__dirname, 'tests/e2e/.env.qa.local') });

const QA_REPORTS = path.resolve(__dirname, 'qa-reports');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['./tests/e2e/reporters/qa-collector-reporter.ts'],
  ],
  outputDir: 'test-results',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    baseURL: process.env.E2E_BUYER_URL ?? 'https://jebdekho.com',
  },
  projects: [
    {
      name: 'setup-merchant',
      testMatch: /setup\/merchant\.auth\.setup\.ts/,
    },
    {
      name: 'setup-admin',
      testMatch: /setup\/admin\.auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /(buyer|rbac|api)\/.*\.spec\.ts/,
    },
    {
      name: 'chromium-merchant',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_MERCHANT_URL ?? 'https://merchant.jebdekho.com',
        storageState: 'qa-reports/.auth/merchant.json',
      },
      testMatch: /merchant\/.*\.spec\.ts/,
      dependencies: ['setup-merchant'],
    },
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_ADMIN_URL ?? 'https://admin.jebdekho.com',
        storageState: 'qa-reports/.auth/admin.json',
      },
      testMatch: /admin\/.*\.spec\.ts/,
      dependencies: ['setup-admin'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /buyer\/homepage\.spec\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile\/.*\.spec\.ts/,
    },
  ],
  metadata: {
    qaReportsDir: QA_REPORTS,
  },
});
