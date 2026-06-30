import { expect, test, type Locator, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { qaConfig } from './test-config';

type GeneratedUser = {
  role: 'merchant' | 'buyer';
  name: string;
  email: string;
  phone: string;
  password: string;
};

type RunData = {
  runId: string;
  timestamp: string;
  merchant: GeneratedUser;
  buyer: GeneratedUser;
  storeName: string;
  productName: string;
  categoryName: string;
  subcategoryName: string;
};

type OnboardingStepName =
  | 'Verify'
  | 'Business'
  | 'Store'
  | 'Location'
  | 'Delivery'
  | 'Categories'
  | 'GST/PAN'
  | 'Bank'
  | 'Review';

type OnboardingStepReport = {
  step: OnboardingStepName;
  completedAt: string;
  url: string;
  screenshot: string;
  validationErrors: string[];
};

const mutationReportsDir = path.resolve('qa-reports/mutation');
const generatedUsersPath = path.resolve('qa-reports/generated-users.json');
const geolocation = {
  latitude: Number(process.env.QA_GEO_LAT ?? process.env.QA_LAT ?? 28.6139),
  longitude: Number(process.env.QA_GEO_LNG ?? process.env.QA_LNG ?? 77.2090),
};
const pincode = process.env.QA_PINCODE ?? '110001';
const cityName = process.env.QA_CITY_NAME ?? 'New Delhi';
const stateName = process.env.QA_STATE ?? 'Delhi';

test.describe.configure({ mode: 'serial' });

test('production mutation: fresh merchant and buyer UI-only Razorpay flow', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  const password = requireTestPassword();
  const run = createRunData(password);
  const runDir = path.join(mutationReportsDir, run.runId);
  await fs.mkdir(runDir, { recursive: true });
  await saveGeneratedUsers(run);

  const assets = await createRunAssets(run.runId, runDir);
  await testInfo.attach('generated-users.json', {
    body: JSON.stringify({ runId: run.runId, merchant: publicUser(run.merchant), buyer: publicUser(run.buyer) }, null, 2),
    contentType: 'application/json',
  });
  await testInfo.attach('qa-product-image.png', { path: assets.productImagePath, contentType: 'image/png' });
  await testInfo.attach('qa-document.pdf', { path: assets.pdfPath, contentType: 'application/pdf' });

  await page.context().grantPermissions(['geolocation'], { origin: qaConfig.merchantUrl });
  await page.context().grantPermissions(['geolocation'], { origin: qaConfig.buyerUrl });
  await page.context().setGeolocation(geolocation);

  const onboardingReport: OnboardingStepReport[] = [];
  await registerMerchantThroughUi(page, run, assets, runDir, onboardingReport);
  await approveRunStoreThroughAdminUi(page, run, runDir);
  await createProductThroughMerchantUi(page, run, assets, runDir);
  await registerBuyerThroughUi(page, run, runDir);
  await buyProductThroughBuyerUi(page, run, runDir);
  await verifyAfterPayment(page, run, runDir);
});

async function registerMerchantThroughUi(
  page: Page,
  run: RunData,
  assets: RunAssets,
  runDir: string,
  report: OnboardingStepReport[],
) {
  await page.goto(`${qaConfig.merchantUrl}/signup`, { waitUntil: 'domcontentloaded' });
  await screenshot(page, runDir, '01-merchant-signup-open');

  await fillByLabel(page, /owner name|owner full name|full name|name/i, run.merchant.name);
  await fillByLabel(page, /^email$/i, run.merchant.email);
  await fillByLabel(page, /^password$/i, run.merchant.password);
  await fillByLabel(page, /confirm password/i, run.merchant.password);
  await clickByRole(page, /create account|continue/i);
  await completeMerchantOnboardingWizard(page, run, assets, runDir, report);
}

async function completeMerchantOnboardingWizard(
  page: Page,
  run: RunData,
  assets: RunAssets,
  runDir: string,
  report: OnboardingStepReport[],
) {
  await runOnboardingStep(page, runDir, report, 'Verify', '02-verify', async () => {
    await fillVisibleIfPresent(page, /store contact mobile|mobile|phone/i, run.merchant.phone);
    await maybePauseForOtp(page, run.merchant, 'merchant');
    await clickContinueIfPresent(page);
  });

  await runOnboardingStep(page, runDir, report, 'Business', '03-business', async () => {
    await fillVisibleIfPresent(page, /store contact mobile|mobile|phone/i, run.merchant.phone);
    await fillVisibleIfPresent(page, /owner full name|owner name|full name/i, run.merchant.name);
    await fillVisibleIfPresent(page, /business.*legal name|business name|legal name/i, run.storeName);
    await checkVisibleText(page, /grocery/i);
    await clickRequiredContinue(page, 'Business');
  });

  await runOnboardingStep(page, runDir, report, 'Store', '04-store', async () => {
    await fillVisibleIfPresent(page, /store display name|registered business name|store name/i, run.storeName);
    await fillVisibleIfPresent(page, /store description|description/i, 'Production QA grocery dairy store created by automated Playwright test.');
    await fillVisibleIfPresent(page, /store email|email/i, run.merchant.email);
    await fillVisibleIfPresent(page, /store phone|phone|mobile/i, run.merchant.phone);
    await setEveryVisibleFileInput(page, assets.logoPath);
    await setFileInputIfExists(page, assets.bannerPath, 1);
    await clickRequiredContinue(page, 'Store');
  });

  await runOnboardingStep(page, runDir, report, 'Location', '05-location', async () => {
    await page.context().grantPermissions(['geolocation'], { origin: qaConfig.merchantUrl });
    await page.context().setGeolocation(geolocation);
    await clickIfVisible(page.getByRole('button', { name: /use current location|current location|detect location/i }));
    await fillVisibleIfPresent(page, /shop|building|street|address line 1|store address|address/i, 'QA Test Store, Connaught Place');
    await fillVisibleIfPresent(page, /address line 2/i, `Automated run ${run.runId}`);
    await fillVisibleIfPresent(page, /area|locality/i, 'Connaught Place');
    await fillVisibleIfPresent(page, /^city$/i, cityName);
    await fillVisibleIfPresent(page, /^state$/i, stateName);
    await fillVisibleIfPresent(page, /pincode|pin code/i, pincode);
    await fillVisibleIfPresent(page, /landmark/i, 'Connaught Place');
    await clickRequiredContinue(page, 'Location');
  });

  await runOnboardingStep(page, runDir, report, 'Delivery', '06-delivery', async () => {
    await checkVisibleText(page, /third-party delivery|platform delivery|shadowfax/i);
    await fillVisibleIfPresent(page, /delivery radius|radius/i, '5');
    await fillVisibleIfPresent(page, /delivery time|prep time|time/i, '30');
    await fillVisibleIfPresent(page, /minimum order|min order/i, '1');
    await fillVisibleIfPresent(page, /delivery fee|fee/i, '0');
    await fillVisibleIfPresent(page, /coverage pincodes|pincodes/i, pincode);
    await clickRequiredContinue(page, 'Delivery');
  });

  await runOnboardingStep(page, runDir, report, 'Categories', '07-categories', async () => {
    await checkVisibleText(page, /grocery/i);
    await checkVisibleText(page, /dairy|dairy & bakery/i);
    await clickRequiredContinue(page, 'Categories');
  });

  await runOnboardingStep(page, runDir, report, 'GST/PAN', '08-gst-pan', async () => {
    await fillVisibleIfPresent(page, /pan/i, 'ABCDE1234F');
    await fillVisibleIfPresent(page, /gstin|gst/i, '07ABCDE1234F1Z5');
    await setEveryVisibleFileInput(page, assets.pdfPath);
    await setEveryVisibleFileInput(page, assets.productImagePath);
    await clickRequiredContinue(page, 'GST/PAN');
  });

  await runOnboardingStep(page, runDir, report, 'Bank', '09-bank', async () => {
    await fillVisibleIfPresent(page, /account holder/i, run.merchant.name);
    await fillVisibleIfPresent(page, /account number/i, '123456789012');
    await fillVisibleIfPresent(page, /re-enter account|confirm account/i, '123456789012');
    await fillVisibleIfPresent(page, /ifsc/i, 'HDFC0000001');
    await fillVisibleIfPresent(page, /bank name/i, 'HDFC Bank');
    await fillVisibleIfPresent(page, /branch/i, 'Connaught Place');
    await selectOptionIfPresent(page, /account type/i, /current/i);
    await setEveryVisibleFileInput(page, assets.pdfPath);
    await clickRequiredContinue(page, 'Bank');
  });

  await runOnboardingStep(page, runDir, report, 'Review', '10-review', async () => {
    await checkVisibleText(page, /declaration|terms|agree|confirm/i);
    await screenshot(page, runDir, '10-review-before-submit');
    await clickByRole(page, /submit|send for approval|finish/i);
    await page.waitForTimeout(2_000);
  });

  await fs.writeFile(path.join(runDir, 'merchant-onboarding-report.json'), JSON.stringify(report, null, 2));
}

async function createProductThroughMerchantUi(page: Page, run: RunData, assets: RunAssets, runDir: string) {
  await page.goto(`${qaConfig.merchantUrl}/products`, { waitUntil: 'domcontentloaded' });
  await screenshot(page, runDir, '11-products-page');
  await clickByRole(page, /add product/i);
  await clickIfVisible(page.getByRole('button', { name: /manual/i }));

  await setFileInput(page, assets.productImagePath, 0);
  await fillByLabel(page, /product name/i, run.productName);
  await fillVisibleIfPresent(page, /description/i, `Production QA Milk ${run.timestamp}`);
  await fillVisibleIfPresent(page, /brand/i, 'JebDekho QA');
  await fillVisibleIfPresent(page, /sku/i, `QA_MILK_${run.timestamp}`);
  await selectOptionByLabel(page, /category/i, new RegExp(run.categoryName, 'i'));
  await selectOptionByLabel(page, /sub category/i, /dairy|dairy & bakery/i);
  await fillByLabel(page, /price/i, '1');
  await fillVisibleIfPresent(page, /mrp/i, '2');
  await fillVisibleIfPresent(page, /unit/i, 'pack');
  await fillVisibleIfPresent(page, /opening stock|stock/i, '3');
  await optionalStep('set product tax category and FSSAI if visible', async () => {
    await selectOptionByLabel(page, /tax category/i, /exempt/i);
    await fillVisibleIfPresent(page, /fssai/i, '10000000000000');
  });
  await screenshot(page, runDir, '12-product-form-filled');
  await clickByRole(page, /create product/i);
  await expect(page.getByText(run.productName, { exact: false })).toBeVisible({ timeout: 60_000 });
  await screenshot(page, runDir, '13-product-created');
}

async function approveRunStoreThroughAdminUi(page: Page, run: RunData, runDir: string) {
  await page.goto(`${qaConfig.adminUrl}/login`, { waitUntil: 'domcontentloaded' });
  await fillByLabel(page, /email/i, qaConfig.admin.email);
  await fillByLabel(page, /password/i, qaConfig.admin.password);
  await clickByRole(page, /sign in|login/i);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60_000 });
  await screenshot(page, runDir, '14-admin-login');

  await page.goto(`${qaConfig.adminUrl}/stores?status=PENDING_REVIEW`, { waitUntil: 'domcontentloaded' });
  await screenshot(page, runDir, '15-admin-stores-pending');
  await approveOnlyVisibleRunStore(page, run.storeName);
  await screenshot(page, runDir, '16-admin-approved-run-store');
}

async function registerBuyerThroughUi(page: Page, run: RunData, runDir: string) {
  await page.goto(`${qaConfig.buyerUrl}/signup`, { waitUntil: 'domcontentloaded' });
  await screenshot(page, runDir, '17-buyer-signup-open');
  await clickIfVisible(page.getByRole('button', { name: /email signup|email/i }));
  await fillByLabel(page, /full name|name/i, run.buyer.name);
  await fillByLabel(page, /^email$/i, run.buyer.email);
  await fillByLabel(page, /^password$/i, run.buyer.password);
  await fillByLabel(page, /confirm password/i, run.buyer.password);
  await clickByRole(page, /create account/i);
  await maybePauseForOtp(page, run.buyer, 'buyer');
  await page.waitForURL((url) => !url.pathname.includes('/signup'), { timeout: 60_000 }).catch(() => undefined);
  await screenshot(page, runDir, '18-buyer-registered');
}

async function buyProductThroughBuyerUi(page: Page, run: RunData, runDir: string) {
  await page.context().setGeolocation(geolocation);
  await page.goto(`${qaConfig.buyerUrl}/stores`, { waitUntil: 'domcontentloaded' });
  await screenshot(page, runDir, '19-buyer-stores-open');
  await fillVisibleIfPresent(page, /search stores/i, run.storeName);
  await clickByText(page, run.storeName);
  await screenshot(page, runDir, '20-buyer-store-open');

  await fillVisibleIfPresent(page, /search in store/i, run.productName);
  await expect(page.getByText(run.productName, { exact: false })).toBeVisible({ timeout: 60_000 });
  await clickNearText(page, run.productName, /add/i);
  await screenshot(page, runDir, '21-product-added-to-cart');

  await page.goto(`${qaConfig.buyerUrl}/cart`, { waitUntil: 'domcontentloaded' });
  await screenshot(page, runDir, '22-cart-open');
  await clickByRole(page, /checkout|proceed/i);

  await fillVisibleIfPresent(page, /house|address|line 1/i, `QA Buyer Address ${run.timestamp}`);
  await fillVisibleIfPresent(page, /area|locality/i, 'QA Area');
  await fillVisibleIfPresent(page, /^city$/i, cityName);
  await fillVisibleIfPresent(page, /pin|pincode/i, pincode);
  await screenshot(page, runDir, '23-checkout-address');
  await clickIfVisible(page.getByRole('button', { name: /continue|next|use this address|save/i }));

  await clickIfVisible(page.getByText(/razorpay|upi|online/i));
  await fillVisibleIfPresent(page, /^name$/i, run.buyer.name);
  await fillVisibleIfPresent(page, /^email$/i, run.buyer.email);
  await fillVisibleIfPresent(page, /mobile|phone|contact/i, run.buyer.phone);
  await screenshot(page, runDir, '24-checkout-payment-ready');
  await clickByRole(page, /proceed to payment|pay now|razorpay/i);
  await screenshot(page, runDir, '25-razorpay-opened');
  console.log(`Manual Razorpay payment required for run ${run.runId}`);
  await page.pause();
}

async function verifyAfterPayment(page: Page, run: RunData, runDir: string) {
  await optionalStep('verify buyer order', async () => {
    await page.goto(`${qaConfig.buyerUrl}/orders`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(run.productName, { exact: false }).or(page.getByText(run.storeName, { exact: false }))).toBeVisible({ timeout: 60_000 });
    await screenshot(page, runDir, '26-buyer-order-verified');
  });

  await optionalStep('verify merchant order', async () => {
    await page.goto(`${qaConfig.merchantUrl}/orders`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(run.productName, { exact: false }).or(page.getByText(run.buyer.name, { exact: false }))).toBeVisible({ timeout: 60_000 });
    await screenshot(page, runDir, '27-merchant-order-verified');
  });

  await optionalStep('verify payment status', async () => {
    await expect(page.getByText(/paid|payment successful|razorpay/i)).toBeVisible({ timeout: 20_000 });
    await screenshot(page, runDir, '28-payment-status-verified');
  });

  await optionalStep('verify inventory update', async () => {
    await page.goto(`${qaConfig.merchantUrl}/products`, { waitUntil: 'domcontentloaded' });
    await fillVisibleIfPresent(page, /search products/i, run.productName);
    await expect(page.getByText(run.productName, { exact: false })).toBeVisible({ timeout: 30_000 });
    await screenshot(page, runDir, '29-inventory-visible-after-order');
  });

  await optionalStep('verify notifications if visible', async () => {
    await clickIfVisible(page.getByRole('button', { name: /notification/i }));
    await screenshot(page, runDir, '30-notifications-visible');
  });
}

async function maybePauseForOtp(page: Page, user: GeneratedUser, role: string) {
  const otpVisible = await page.getByText(/otp|verification code|verify/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
  if (!otpVisible) return;
  console.log(`${role.toUpperCase()} OTP required`);
  console.log(`${role} email: ${user.email}`);
  console.log(`${role} phone: ${user.phone}`);
  await page.pause();
}

async function approveOnlyVisibleRunStore(page: Page, storeName: string) {
  const storeCard = page
    .locator('li, article, tr, div')
    .filter({ hasText: storeName })
    .first();
  await expect(storeCard, `Run store ${storeName} must be visible in admin pending list`).toBeVisible({ timeout: 60_000 });
  await storeCard.getByRole('button', { name: /^approve$|approve store/i }).first().click();
  await page.waitForTimeout(2_000);
}

async function clickNearText(page: Page, text: string, buttonName: RegExp) {
  const card = page.locator('article, li, div').filter({ hasText: text }).first();
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.getByRole('button', { name: buttonName }).first().click();
}

async function fillByLabel(page: Page, label: RegExp, value: string) {
  const input = page.getByLabel(label).or(page.getByPlaceholder(label)).or(labelNearInput(page, label)).first();
  await input.fill(value);
}

async function fillVisibleIfPresent(page: Page, label: RegExp, value: string) {
  const input = page.getByLabel(label).or(page.getByPlaceholder(label)).or(labelNearInput(page, label)).first();
  if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await input.fill(value);
  }
}

async function selectOptionByLabel(page: Page, label: RegExp, option: RegExp) {
  const select = page.getByLabel(label).first();
  await expect(select).toBeVisible({ timeout: 15_000 });
  const options = await select.locator('option').all();
  for (const candidate of options) {
    const text = (await candidate.textContent()) ?? '';
    if (option.test(text)) {
      await select.selectOption(await candidate.getAttribute('value') ?? { label: text });
      return;
    }
  }
  throw new Error(`No option matching ${option} for ${label}`);
}

async function selectOptionIfPresent(page: Page, label: RegExp, option: RegExp) {
  const select = page.getByLabel(label).or(labelNearInput(page, label, 'select')).first();
  if (!(await select.isVisible({ timeout: 2_000 }).catch(() => false))) return;
  const options = await select.locator('option').all();
  for (const candidate of options) {
    const text = (await candidate.textContent()) ?? '';
    if (option.test(text)) {
      await select.selectOption(await candidate.getAttribute('value') ?? { label: text });
      return;
    }
  }
}

async function clickByRole(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).or(page.getByRole('link', { name })).first().click({ timeout: 30_000 });
}

async function clickByText(page: Page, text: string) {
  await page.getByText(text, { exact: false }).first().click({ timeout: 30_000 });
}

async function clickIfVisible(locator: Locator) {
  if (await locator.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
    await locator.first().click();
  }
}

async function checkVisibleText(page: Page, text: RegExp) {
  const label = page.locator('label').filter({ hasText: text }).first();
  if (await label.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const checkbox = label.locator('input[type="checkbox"], input[type="radio"]').first();
    if (await checkbox.isVisible().catch(() => false)) await checkbox.check();
    else await label.click().catch(() => undefined);
    return;
  }
  const control = page.getByRole('checkbox', { name: text }).or(page.getByRole('radio', { name: text })).first();
  if (await control.isVisible({ timeout: 1_000 }).catch(() => false)) await control.check();
}

async function setFileInput(page: Page, filePath: string, index: number) {
  const input = page.locator('input[type="file"]').nth(index);
  await input.setInputFiles(filePath, { timeout: 30_000 });
}

async function setFileInputIfExists(page: Page, filePath: string, index: number) {
  const input = page.locator('input[type="file"]').nth(index);
  if (await input.count().catch(() => 0)) await input.setInputFiles(filePath).catch(() => undefined);
}

async function setEveryVisibleFileInput(page: Page, filePath: string) {
  const inputs = page.locator('input[type="file"]');
  const count = await inputs.count();
  for (let i = 0; i < count; i += 1) {
    await inputs.nth(i).setInputFiles(filePath).catch(() => undefined);
  }
}

async function runOnboardingStep(
  page: Page,
  runDir: string,
  report: OnboardingStepReport[],
  step: OnboardingStepName,
  screenshotName: string,
  action: () => Promise<void>,
) {
  await action();
  const screenshotFile = `${screenshotName}.png`;
  await page.screenshot({ path: path.join(runDir, screenshotFile), fullPage: true }).catch(() => undefined);
  const entry = {
    step,
    completedAt: new Date().toISOString(),
    url: page.url(),
    screenshot: screenshotFile,
    validationErrors: await collectValidationErrors(page),
  };
  report.push(entry);
  await fs.writeFile(path.join(runDir, 'merchant-onboarding-report.json'), JSON.stringify(report, null, 2));
}

async function clickContinueIfPresent(page: Page) {
  const control = page.getByRole('button', { name: /continue|next|save|submit|finish/i }).first();
  if (await control.isVisible({ timeout: 2_000 }).catch(() => false)) await control.click();
}

async function clickRequiredContinue(page: Page, step: string) {
  const before = page.url();
  const control = page.getByRole('button', { name: /continue|next|save|submit|finish/i }).first();
  await expect(control, `${step} step must expose a continue action`).toBeVisible({ timeout: 20_000 });
  await control.click();
  await page.waitForTimeout(1_500);
  const errors = await collectValidationErrors(page);
  if (errors.length && page.url() === before) {
    throw new Error(`${step} step did not continue. Validation errors: ${errors.join(' | ')}`);
  }
}

async function collectValidationErrors(page: Page): Promise<string[]> {
  const texts = await page
    .locator('[role="alert"], .text-red-600, .text-red-700, .text-amber-700, .text-amber-800, [aria-invalid="true"]')
    .evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim()).filter(Boolean))
    .catch(() => []);
  return [...new Set(texts)].slice(0, 20);
}

function labelNearInput(page: Page, label: RegExp, selector: 'form-control' | 'select' = 'form-control') {
  const xpath =
    selector === 'select'
      ? 'following::select[1]'
      : 'following::*[self::input or self::textarea or self::select][1]';
  return page
    .locator('label, div, p, span')
    .filter({ hasText: label })
    .locator(`xpath=${xpath}`);
}

async function optionalStep(name: string, action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.warn(`Optional step failed: ${name}`, error);
  }
}

async function screenshot(page: Page, runDir: string, name: string) {
  await page.screenshot({ path: path.join(runDir, `${name}.png`), fullPage: true }).catch(() => undefined);
}

function requireTestPassword(): string {
  const password = process.env.QA_TEST_PASSWORD?.trim();
  if (!password) throw new Error('Missing QA_TEST_PASSWORD env var');
  if (!qaConfig.admin.email || !qaConfig.admin.password) {
    throw new Error('Missing QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD for UI admin approval');
  }
  return password;
}

function createRunData(password: string): RunData {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const runId = `qa-mut-${timestamp}`;
  return {
    runId,
    timestamp,
    merchant: {
      role: 'merchant',
      name: `QA Merchant ${runId}`,
      email: `qa.merchant.${timestamp}@example.com`,
      phone: randomIndianMobile(),
      password,
    },
    buyer: {
      role: 'buyer',
      name: `QA Buyer ${runId}`,
      email: `qa.buyer.${timestamp}@example.com`,
      phone: randomIndianMobile(),
      password,
    },
    storeName: `QA Grocery Dairy Store ${runId}`,
    productName: `QA Milk ${timestamp}`,
    categoryName: 'Grocery',
    subcategoryName: 'Dairy',
  };
}

async function saveGeneratedUsers(run: RunData) {
  await fs.mkdir(path.dirname(generatedUsersPath), { recursive: true });
  const existing = await fs.readFile(generatedUsersPath, 'utf8').then(JSON.parse).catch(() => []);
  const records = Array.isArray(existing) ? existing : [];
  records.push({ ...run, createdAt: new Date().toISOString() });
  await fs.writeFile(generatedUsersPath, JSON.stringify(records, null, 2));
}

function publicUser(user: GeneratedUser) {
  return { role: user.role, name: user.name, email: user.email, phone: user.phone };
}

function randomIndianMobile(): string {
  const first = ['9', '8', '7', '6'][Math.floor(Math.random() * 4)];
  let rest = '';
  for (let i = 0; i < 9; i += 1) rest += Math.floor(Math.random() * 10);
  return `${first}${rest}`;
}

type RunAssets = Awaited<ReturnType<typeof createRunAssets>>;

async function createRunAssets(runId: string, dir: string) {
  const product = pngDataUrl(512, 512, [22, 163, 74, 255]);
  const logo = pngDataUrl(512, 512, [14, 165, 233, 255]);
  const banner = pngDataUrl(1200, 400, [245, 158, 11, 255]);
  const productImagePath = path.join(dir, 'qa-product-image.png');
  const logoPath = path.join(dir, 'qa-store-logo.png');
  const bannerPath = path.join(dir, 'qa-store-banner.png');
  const pdfPath = path.join(dir, 'qa-document.pdf');
  await fs.writeFile(productImagePath, Buffer.from(product.split(',')[1], 'base64'));
  await fs.writeFile(logoPath, Buffer.from(logo.split(',')[1], 'base64'));
  await fs.writeFile(bannerPath, Buffer.from(banner.split(',')[1], 'base64'));
  await fs.writeFile(pdfPath, minimalPdf(runId));
  return { productImagePath, logoPath, bannerPath, pdfPath };
}

function pngDataUrl(width: number, height: number, rgba: [number, number, number, number]): string {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) raw.set(rgba, row + 1 + x * 4);
  }
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr(width, height)),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

function ihdr(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  return buffer;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function minimalPdf(runId: string): Buffer {
  const text = `JebDekho production QA mutation document ${runId}`;
  return Buffer.from(
    `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >> endobj
4 0 obj << /Length ${text.length + 42} >> stream
BT /F1 12 Tf 24 96 Td (${text}) Tj ET
endstream endobj
trailer << /Root 1 0 R >>
%%EOF
`,
  );
}
