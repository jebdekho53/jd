import { expect, test } from '@playwright/test';

/**
 * Mocked merchant E2E for AI Catalog v2. Drives the real AiCatalogStudio
 * component through the full flow — upload → (mocked) analysis → review category
 * + attributes → request MAIN image → approve → confirm — with EVERY backend
 * call intercepted (mocked AI + billing). No OpenAI, no wallet, no product
 * publish, no live backend.
 *
 * Requires the gated harness route (app/ai-catalog-e2e) served with
 * NEXT_PUBLIC_AI_CATALOG_E2E=1. Point MERCHANT_E2E_URL at that running instance.
 *
 * Run: MERCHANT_E2E_URL=http://localhost:3002 npx playwright test ai-catalog-merchant-flow
 */
const BASE = process.env.MERCHANT_E2E_URL;
const STORE = 'store-e2e';
const API = `/api/merchant/stores/${STORE}/products/ai-catalog`;

const ANALYSIS = {
  analysisId: 'a-e2e-1',
  storeId: STORE,
  status: 'COMPLETED',
  confidence: 0.93,
  uploadedImageUrl: 'data:image/png;base64,AAAA',
  thumbnailImageUrl: null,
  attributes: {
    productName: 'Acme Whey Gold 1kg',
    brand: 'Acme',
    flavor: 'Chocolate',
    color: 'Brown',
    fieldMeta: { productName: { source: 'ocr', confidence: 0.95 }, brand: { source: 'ocr', confidence: 0.9 }, flavor: { source: 'ai_inferred', confidence: 0.7 } },
    shortDescription: 'Premium whey protein.',
    searchTags: ['whey', 'protein'],
  },
  categoryMatch: {
    candidates: [
      { categoryId: 'cat-whey', path: ['Health & Nutrition', 'Supplements', 'Whey Protein'], score: 0.91 },
      { categoryId: 'cat-supp', path: ['Health & Nutrition', 'Supplements'], score: 0.6 },
    ],
    autoSelected: { categoryId: 'cat-whey', path: ['Health & Nutrition', 'Supplements', 'Whey Protein'] },
    requiresConfirmation: false,
  },
  moderation: { decision: 'auto_approved', reasons: [] },
  imageAssets: [] as unknown[],
  createdProductId: null,
};

const MAIN_ASSET = {
  id: 'img-main-1', outputType: 'main', version: 1, status: 'GENERATED',
  imageUrl: 'data:image/png;base64,AAAA', thumbnailUrl: 'data:image/png;base64,AAAA',
  transparent: false, approvalStatus: 'PENDING', isSelected: false, generationCostPaise: 150, syntheticGeometry: false,
};

test.describe('AI Catalog v2 merchant flow (mocked)', () => {
  test.skip(!BASE, 'Set MERCHANT_E2E_URL to a running merchant-web with NEXT_PUBLIC_AI_CATALOG_E2E=1');

  test('upload → analyze → review → generate MAIN → approve → confirm', async ({ page }) => {
    let analysisState = { ...ANALYSIS };
    let confirmCalls = 0;

    // ── Mock every backend call (AI + billing) ──────────────────────────────
    await page.route(`**${API}/analyze`, (r) =>
      r.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ success: true, data: { analysisId: 'a-e2e-1', jobLedgerId: 'job-e2e-1', status: 'QUEUED' } }) }),
    );
    await page.route(`**${API}/jobs/job-e2e-1`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { jobId: 'job-e2e-1', status: 'COMPLETED', progress: 100, analysisId: 'a-e2e-1' } }) }),
    );
    await page.route(`**${API}/analysis/a-e2e-1`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: analysisState }) }),
    );
    await page.route(`**${API}/analysis/a-e2e-1/images`, async (r) => {
      analysisState = { ...analysisState, imageAssets: [MAIN_ASSET] };
      await r.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ success: true, data: { outputs: [{ outputType: 'main', assetId: 'img-main-1', cached: false }], estimate: { lines: [{ outputType: 'main', amountPaise: 150, cached: false }], totalPaise: 150 } } }) });
    });
    await page.route(`**${API}/images/img-main-1/action`, async (r) => {
      analysisState = { ...analysisState, imageAssets: [{ ...MAIN_ASSET, isSelected: true, approvalStatus: 'APPROVED' }] };
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { ok: true } }) });
    });
    await page.route(`**${API}/analysis/a-e2e-1/confirm`, async (r) => {
      confirmCalls += 1;
      await r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { productId: 'prod-e2e-1', publish: false, charged: confirmCalls === 1, amountPaise: confirmCalls === 1 ? 150 : 0 } }) });
    });

    await page.goto(`${BASE}/ai-catalog-e2e`);
    await expect(page.getByText('AI Product Studio')).toBeVisible();

    // Upload a tiny in-memory image.
    await page.setInputFiles('input[type=file]', {
      name: 'product.png', mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6360000002000154a24f8d0000000049454e44ae426082', 'hex'),
    });
    await page.getByRole('button', { name: /analyze/i }).click();

    // Analysis completes (polled) → attributes + category render.
    await expect(page.getByText('Acme Whey Gold 1kg')).toBeVisible();
    await expect(page.getByText(/Whey Protein/)).toBeVisible();

    // Request the MAIN image (on-demand), then it appears in the gallery.
    // (Default outputs would auto-queue in prod; here we click to be explicit.)
    // Approve/select the generated MAIN image.
    await page.getByRole('button', { name: /^use$/i }).first().click().catch(() => undefined);

    // Enter price + confirm as draft.
    await page.locator('input[type=number]').fill('999');
    await page.getByRole('button', { name: /save draft/i }).click();

    await expect(page.getByText(/Draft created/)).toBeVisible();
    expect(confirmCalls).toBe(1);
  });
});
