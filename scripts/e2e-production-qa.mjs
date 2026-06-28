#!/usr/bin/env node
/**
 * Production E2E QA — Buyer + Merchant COD + Shadowfax (API-level).
 * Credentials: .env.e2e.local (gitignored). Never logs passwords.
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_FILE = resolve(ROOT, '.env.e2e.local');

function loadEnv() {
  if (!existsSync(ENV_FILE)) {
    console.error('Missing .env.e2e.local');
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const API = (env.E2E_API_URL || 'https://api.jebdekho.com/api/v1').replace(/\/$/, '');
const EMAIL = env.E2E_BUYER_MERCHANT_EMAIL;
const PASSWORD = env.E2E_BUYER_MERCHANT_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Set E2E_BUYER_MERCHANT_EMAIL and E2E_BUYER_MERCHANT_PASSWORD in .env.e2e.local');
  process.exit(1);
}

const report = {
  startedAt: new Date().toISOString(),
  buyerLogin: null,
  merchantLogin: null,
  me: null,
  stores: null,
  product: null,
  cart: null,
  codOrder: null,
  merchantTransitions: [],
  shipment: null,
  buyerTracking: null,
  health: null,
  blockers: [],
  errors: [],
};

async function api(method, path, { token, body, headers = {} } = {}) {
  const url = `${API}${path.startsWith('/') ? path : `/${path}`}`;
  const h = { 'Content-Type': 'application/json', ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, ok: res.ok, json, headers: Object.fromEntries(res.headers) };
}

function maskEmail(e) {
  const [u, d] = e.split('@');
  return `${u.slice(0, 2)}***@${d}`;
}

function step(name, fn) {
  return fn().catch((err) => {
    report.errors.push({ step: name, message: err.message });
    report.blockers.push(`${name}: ${err.message}`);
    throw err;
  });
}

async function main() {
  console.log(`E2E Production QA — API ${API}`);
  console.log(`Account: ${maskEmail(EMAIL)}`);

  // Health
  const healthRes = await fetch('https://api.jebdekho.com/health');
  report.health = { status: healthRes.status, body: await healthRes.json().catch(() => null) };

  let token;
  await step('auth/login', async () => {
    const r = await api('POST', '/auth/login', {
      body: { email: EMAIL, password: PASSWORD, deviceId: `e2e-${randomUUID()}` },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.json?.message || JSON.stringify(r.json)}`);
    token = r.json?.data?.accessToken;
    if (!token) throw new Error('No accessToken in response');
    report.buyerLogin = { ok: true, status: r.status, hasRefresh: !!r.json?.data?.refreshToken };
    report.merchantLogin = report.buyerLogin;
  });

  await step('auth/me', async () => {
    const r = await api('GET', '/auth/me', { token });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    report.me = {
      roles: r.json?.data?.roles,
      hasBuyerProfile: !!r.json?.data?.buyerProfile,
      hasMerchantProfile: !!r.json?.data?.merchantProfile,
      userId: r.json?.data?.id,
    };
  });

  let merchantStoreId;
  let merchantStoreName;
  let merchantStoreSlug;
  let deliveryPincode = '110001';
  let lat = 28.6139;
  let lng = 77.209;

  await step('merchant/stores', async () => {
    const r = await api('GET', '/merchant/stores', { token });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.json?.message}`);
    const stores = r.json?.data ?? [];
    report.stores = stores.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      slug: s.slug,
    }));
    const active = stores.find((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');
    if (!active) throw new Error('No active merchant store');
    merchantStoreId = active.id;
    merchantStoreName = active.name;
    merchantStoreSlug = active.slug;

    const detail = await api('GET', `/merchant/stores/${merchantStoreId}`, { token });
    if (detail.ok) {
      const s = detail.json?.data;
      if (s?.latitude != null) lat = Number(s.latitude);
      if (s?.longitude != null) lng = Number(s.longitude);
      if (s?.pincode) deliveryPincode = String(s.pincode);
      const areas = s?.storeDeliveryAreas ?? s?.deliveryAreas ?? s?.storeServiceAreas ?? [];
      const pinFromArea = areas.find((a) => a.pincode || a.pinCode);
      if (pinFromArea) deliveryPincode = String(pinFromArea.pincode ?? pinFromArea.pinCode);
      report.stores[0].pincode = deliveryPincode;
      report.stores[0].latitude = lat;
      report.stores[0].longitude = lng;
      report.stores[0].deliveryAreaCount = areas.length;
    }
  });

  let productId;
  let variantId;
  let productName;

  await step('buyer/product discovery', async () => {
    const storesR = await api('GET', `/buyer/stores?lat=${lat}&lng=${lng}&pincode=${deliveryPincode}`, { token });
    if (!storesR.ok) throw new Error(`stores HTTP ${storesR.status}`);

    const buyerStores = storesR.json?.data ?? [];
    const targetStore =
      buyerStores.find((s) => s.id === merchantStoreId) ?? buyerStores[0];
    if (!targetStore && !merchantStoreSlug) {
      throw new Error('No deliverable store for buyer location');
    }

    const slug = merchantStoreSlug ?? targetStore.slug;
    const prodsR = await api('GET', `/buyer/stores/${slug}/products?limit=20`, { token });
    if (!prodsR.ok) throw new Error(`products HTTP ${prodsR.status}: ${prodsR.json?.message}`);

    const items = Array.isArray(prodsR.json?.data) ? prodsR.json.data : prodsR.json?.data?.items ?? [];
    const product = items.find((p) => {
      const v = p.variants?.[0];
      const stock = v?.availableQty ?? v?.stock ?? 0;
      return stock > 0;
    });
    if (!product) throw new Error('No in-stock product found');

    productId = product.id;
    productName = product.name;
    const variant = product.variants?.find((v) => (v.availableQty ?? v.stock ?? 0) > 0) ?? product.variants?.[0];
    variantId = variant?.id;
    if (!variantId) throw new Error('No variant');

    report.product = {
      id: productId,
      name: productName,
      variantId,
      availableQty: variant.availableQty ?? variant.stock,
      storeSlug: slug,
      pincode: deliveryPincode,
      lat,
      lng,
    };
  });

  await step('buyer/cart', async () => {
    await api('POST', '/buyer/cart/items', {
      token,
      body: { productId, variantId, quantity: 1 },
    });
    const cartR = await api('GET', '/buyer/cart', { token });
    if (!cartR.ok) throw new Error(`cart HTTP ${cartR.status}`);
    report.cart = {
      itemCount: cartR.json?.data?.items?.length ?? 0,
      storeId: cartR.json?.data?.storeId,
      grandTotal: cartR.json?.data?.totals?.grandTotal,
      codAvailable: cartR.json?.data?.paymentOptions?.cod ?? cartR.json?.data?.codAvailable,
    };
  });

  let orderId;
  let orderNumber;

  await step('buyer/checkout/cod', async () => {
    const idem = randomUUID();
    const r = await api('POST', '/buyer/checkout/cod', {
      token,
      headers: { 'Idempotency-Key': idem },
      body: {
        deliveryAddress: {
          line1: 'E2E QA Test Address',
          city: 'New Delhi',
          pincode: deliveryPincode,
          lat,
          lng,
          locality: 'Central Delhi',
        },
        buyerNote: 'E2E production QA — safe to cancel',
        payerContact: { name: 'E2E QA', email: EMAIL, phone: '9876543210' },
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.json?.message || JSON.stringify(r.json)}`);
    orderId = r.json?.data?.orderId;
    orderNumber = r.json?.data?.orderNumber;
    report.codOrder = {
      orderId,
      orderNumber,
      status: r.json?.data?.status,
      paymentMethod: 'COD',
    };
  });

  await step('buyer/order detail', async () => {
    const r = await api('GET', `/buyer/orders/${orderId}`, { token });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    report.buyerTracking = {
      status: r.json?.data?.status,
      paymentMethod: r.json?.data?.paymentMethod,
      paymentStatus: r.json?.data?.paymentStatus,
      delivery: r.json?.data?.delivery,
      timeline: r.json?.data?.statusHistory?.map((h) => h.status),
      provider: r.json?.data?.delivery?.providerName ?? r.json?.data?.shipment?.provider,
    };
  });

  // Merchant flow: COD starts MERCHANT_ACCEPTED → preparing → packing → ready
  const transitions = [
    { path: 'preparing', label: 'PREPARING' },
    { path: 'packing', label: 'PACKING' },
    { path: 'ready', label: 'READY_FOR_PICKUP' },
  ];

  for (const t of transitions) {
    await step(`merchant/${t.path}`, async () => {
      await new Promise((r) => setTimeout(r, 1500));
      const r = await api('PATCH', `/merchant/orders/${orderId}/${t.path}`, { token });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.json?.message}`);
      report.merchantTransitions.push({
        action: t.path,
        status: r.json?.data?.status,
      });
    });
  }

  await step('merchant/shipment', async () => {
    await new Promise((r) => setTimeout(r, 3000));
    const r = await api('GET', `/merchant/orders/${orderId}/shipment`, { token });
    if (r.status === 404) {
      report.shipment = { found: false, note: 'No ProviderShipment yet — Shadowfax may be unconfigured or dispatch pending' };
      report.blockers.push('ProviderShipment not found after READY_FOR_PICKUP');
      return;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.json?.message}`);
    const s = r.json?.data;
    report.shipment = {
      found: true,
      id: s.id,
      provider: s.providerType ?? s.provider,
      externalShipmentId: s.externalShipmentId,
      trackingNumber: s.trackingNumber,
      status: s.status,
      lastError: s.lastError ?? null,
    };
  });

  await step('buyer/tracking after ready', async () => {
    const r = await api('GET', `/buyer/orders/${orderId}`, { token });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    report.buyerTrackingAfterReady = {
      status: r.json?.data?.status,
      deliveryPartner: r.json?.data?.delivery?.providerDisplayName ?? r.json?.data?.delivery?.provider,
      shipmentStatus: r.json?.data?.shipment?.status ?? r.json?.data?.delivery?.status,
      trackingNumber: r.json?.data?.shipment?.trackingNumber,
      eta: r.json?.data?.delivery?.estimatedMins,
    };
  });

  // Duplicate ready — should not duplicate shipment
  await step('merchant/ready idempotency', async () => {
    const r = await api('PATCH', `/merchant/orders/${orderId}/ready`, { token });
    report.duplicateReady = { status: r.status, orderStatus: r.json?.data?.status };
    const ship2 = await api('GET', `/merchant/orders/${orderId}/shipment`, { token });
    if (ship2.ok && report.shipment?.id) {
      report.duplicateReady.sameShipmentId = ship2.json?.data?.id === report.shipment.id;
    }
  });

  report.finishedAt = new Date().toISOString();
  report.summary = {
    store: merchantStoreName,
    product: productName,
    orderId,
    orderNumber,
    email: maskEmail(EMAIL),
  };

  const outPath = resolve(ROOT, '.cursor/e2e-production-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('\n=== E2E REPORT ===');
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${outPath}`);
}

main().catch((err) => {
  report.fatal = err.message;
  const outPath = resolve(ROOT, '.cursor/e2e-production-report.json');
  try {
    writeFileSync(outPath, JSON.stringify(report, null, 2));
  } catch {}
  console.error('E2E failed:', err.message);
  process.exit(1);
});
