/**
 * QA test configuration — loads from environment variables.
 *
 * ⚠️  SECURITY WARNING: Never commit real credentials to version control.
 * Use `.env.e2e.local` (repo root) or `tests/e2e/.env.qa.local` for local secrets.
 * Production CI should inject credentials via CI secrets only.
 */

export interface QaCredentials {
  email: string;
  password: string;
}

export interface QaTestConfig {
  buyerUrl: string;
  merchantUrl: string;
  adminUrl: string;
  apiUrl: string;
  buyer: QaCredentials;
  merchant: QaCredentials;
  admin: QaCredentials;
  qaReportsDir: string;
  testProductName: string;
  testCategoryName: string;
}

function env(key: string, fallback = ''): string {
  return process.env[key]?.trim() || fallback;
}

export const qaConfig: QaTestConfig = {
  buyerUrl: env('E2E_BUYER_URL', 'https://jebdekho.com'),
  merchantUrl: env('E2E_MERCHANT_URL', 'https://merchant.jebdekho.com'),
  adminUrl: env('E2E_ADMIN_URL', 'https://admin.jebdekho.com'),
  apiUrl: env('E2E_API_URL', 'https://api.jebdekho.com'),
  buyer: {
    email: env('E2E_BUYER_EMAIL', env('E2E_BUYER_MERCHANT_EMAIL', 'rahulseth3988@gmail.com')),
    password: env('E2E_BUYER_PASSWORD', env('E2E_BUYER_MERCHANT_PASSWORD', 'Jhx82ndc9g@')),
  },
  merchant: {
    email: env('E2E_MERCHANT_EMAIL', env('E2E_BUYER_MERCHANT_EMAIL', 'rahulseth3988@gmail.com')),
    password: env('E2E_MERCHANT_PASSWORD', env('E2E_BUYER_MERCHANT_PASSWORD', 'Jhx82ndc9g@')),
  },
  admin: {
    email: env('E2E_ADMIN_EMAIL', 'jebdekho@gmail.com'),
    password: env('E2E_ADMIN_PASSWORD', 'Rahulrashiseth@1302'),
  },
  qaReportsDir: env('QA_REPORTS_DIR', 'qa-reports'),
  testProductName: 'QA TEST PRODUCT - DELETE AFTER TEST',
  testCategoryName: 'QA TEST CATEGORY - DELETE AFTER TEST',
};

export const SEARCH_QUERIES = ['milk', 'rice', 'phone', 'xyznotfoundtest', '@#$%', 'a'.repeat(120)] as const;

export const DESTRUCTIVE_ACTIONS_BLOCKED = [
  'place_order',
  'accept_order',
  'reject_order',
  'dispatch_order',
  'approve_merchant',
  'reject_merchant',
  'delete_production_data',
  'razorpay_payment',
  'shadowfax_dispatch',
] as const;
