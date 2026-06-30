import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.qa') });
dotenv.config({ path: path.resolve(__dirname, '.env.e2e.local') });
dotenv.config({ path: path.resolve(__dirname, 'tests/e2e/.env.qa.local') });

const qaReports = path.resolve(__dirname, 'qa-reports');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  outputDir: 'qa-reports/test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'qa-reports/playwright-html', open: 'never' }],
    ['json', { outputFile: 'qa-reports/playwright-results.json' }],
    ['./tests/e2e/reporters/qa-collector-reporter.ts'],
  ],
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    baseURL: process.env.QA_BUYER_URL ?? process.env.E2E_BUYER_URL ?? 'https://jebdekho.com',
  },
  projects: [
    {
      name: 'production-qa-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /jebdekho-production-qa\.spec\.ts/,
    },
    {
      name: 'production-qa-mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /jebdekho-production-qa\.spec\.ts/,
    },
    {
      name: 'production-mutation-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /jebdekho-production-mutation\.spec\.ts/,
    },
    {
      name: 'setup-buyer',
      testMatch: /setup\/buyer\.auth\.setup\.ts/,
    },
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
      testMatch: [
        /(buyer|rbac|api)\/.*\.spec\.ts/,
        /(buyer-prod|merchant-prod|admin-prod|navigation-audit|api-network-audit)\.spec\.ts/,
      ],
      dependencies: ['setup-buyer', 'setup-merchant', 'setup-admin'],
    },
    {
      name: 'chromium-merchant',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.QA_MERCHANT_URL ?? process.env.E2E_MERCHANT_URL ?? 'https://merchant.jebdekho.com',
        storageState: 'playwright/.auth/merchant.json',
      },
      testMatch: /merchant\/.*\.spec\.ts/,
      dependencies: ['setup-merchant'],
    },
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.QA_ADMIN_URL ?? process.env.E2E_ADMIN_URL ?? 'https://admin.jebdekho.com',
        storageState: 'playwright/.auth/admin.json',
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
  metadata: { qaReportsDir: qaReports },
});
