import { ShadowfaxClient } from '../apps/api/src/modules/logistics/providers/shadowfax/shadowfax.client';
import type { ConfigService } from '@nestjs/config';
import { loadRuntimeEnv, present, safeUrlHost } from './runtime-env';
import {
  normalizeShadowfaxApiBase,
  resolveShadowfaxApiMode,
} from '../apps/api/src/modules/logistics/providers/shadowfax/shadowfax-url.util';

type Command = 'health' | 'serviceability' | 'test-shipment' | 'diagnose';

const envLoadResult = loadRuntimeEnv();
if (!process.env.NODE_ENV && envLoadResult.filesLoaded.some((file) => file.endsWith('.env.production'))) {
  process.env.NODE_ENV = 'production';
}

class EnvConfig {
  get<T = string>(key: string, fallback?: T): T {
    const value = process.env[key];
    return (value == null || value === '' ? fallback : value) as T;
  }
}

function enabled(): boolean {
  return process.env.ENABLE_SHADOWFAX !== 'false';
}

function printResult(ok: boolean, message: string, data?: Record<string, unknown>): void {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function configSummary(): Record<string, unknown> {
  return {
    ENABLE_SHADOWFAX: process.env.ENABLE_SHADOWFAX ?? 'not set',
    SHADOWFAX_API_URL_HOST: safeUrlHost(process.env.SHADOWFAX_API_URL),
    SHADOWFAX_API_MODE: process.env.SHADOWFAX_API_MODE ?? 'not set',
    SHADOWFAX_TEST_TOKEN: present(process.env.SHADOWFAX_TEST_TOKEN),
    SHADOWFAX_PRODUCTION_TOKEN: present(process.env.SHADOWFAX_PRODUCTION_TOKEN),
    SHADOWFAX_WEBHOOK_SECRET: present(process.env.SHADOWFAX_WEBHOOK_SECRET),
  };
}

function providerMessage(data: unknown): string {
  if (!data) return '';
  if (typeof data === 'string') return data.replace(/\s+/g, ' ').slice(0, 180);
  if (typeof data !== 'object') return String(data).slice(0, 180);
  const row = data as Record<string, unknown>;
  const value = row.message ?? row.error ?? row.detail ?? row.reason ?? row.msg;
  if (typeof value === 'string') return value.slice(0, 180);
  if (Array.isArray(value)) return value.join('; ').slice(0, 180);
  return JSON.stringify(data).slice(0, 180);
}

async function readProviderBody(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function assertBaseConfig(command: Command): ShadowfaxClient | null {
  if (!enabled()) {
    printResult(false, 'Shadowfax is disabled by ENABLE_SHADOWFAX=false', configSummary());
    return null;
  }
  if (!process.env.SHADOWFAX_API_URL) {
    printResult(false, 'SHADOWFAX_API_URL is not configured', configSummary());
    return null;
  }
  if (!process.env.SHADOWFAX_TEST_TOKEN && !process.env.SHADOWFAX_PRODUCTION_TOKEN) {
    printResult(false, 'Shadowfax token is not configured', configSummary());
    return null;
  }
  const client = new ShadowfaxClient(new EnvConfig() as unknown as ConfigService);
  if (!client.isConfigured()) {
    printResult(false, `Shadowfax ${command} client is not fully configured`, configSummary());
    return null;
  }
  return client;
}

async function runHealth(): Promise<number> {
  const client = assertBaseConfig('health');
  if (!client) return 1;
  const result = await client.healthCheck();
  printResult(result.healthy, `Shadowfax health ${result.healthy ? 'succeeded' : 'failed'}`, {
    latencyMs: result.latencyMs,
    message: result.message,
  });
  return result.healthy ? 0 : 1;
}

async function runServiceability(): Promise<number> {
  const client = assertBaseConfig('serviceability');
  if (!client) return 1;
  try {
    const result = await client.estimatePrice({
      pickup_lat: Number(process.env.SHADOWFAX_TEST_PICKUP_LAT ?? 28.6139),
      pickup_lng: Number(process.env.SHADOWFAX_TEST_PICKUP_LNG ?? 77.209),
      drop_lat: Number(process.env.SHADOWFAX_TEST_DROPOFF_LAT ?? 28.62),
      drop_lng: Number(process.env.SHADOWFAX_TEST_DROPOFF_LNG ?? 77.22),
      weight_g: Number(process.env.SHADOWFAX_TEST_WEIGHT_G ?? 500),
      pincode: serviceabilityPincode(),
    });
    printResult(true, 'Shadowfax serviceability succeeded', {
      providerResponseKeys: Object.keys(result),
    });
    return 0;
  } catch (err) {
    printResult(false, 'Shadowfax serviceability failed', {
      message: err instanceof Error ? err.message : 'Unknown error',
    });
    return 1;
  }
}


function serviceabilityPincode(): string {
  return String(
    process.env.SHADOWFAX_TEST_PINCODE ??
      process.env.SHADOWFAX_TEST_DROPOFF_PINCODE ??
      process.env.SHADOWFAX_SERVICEABILITY_PINCODE ??
      '110001',
  ).trim();
}

function tokenForMode(mode: ReturnType<typeof resolveShadowfaxApiMode>): string | undefined {
  if (mode === 'dale_staging' || mode === 'hl_staging') return process.env.SHADOWFAX_TEST_TOKEN;
  if (mode === 'dale_production') return process.env.SHADOWFAX_PRODUCTION_TOKEN;
  if (process.env.NODE_ENV === 'production') return process.env.SHADOWFAX_PRODUCTION_TOKEN;
  return process.env.SHADOWFAX_TEST_TOKEN ?? process.env.SHADOWFAX_PRODUCTION_TOKEN;
}


async function runDiagnose(): Promise<number> {
  const client = assertBaseConfig('diagnose');
  if (!client) return 1;
  const mode = client.getApiMode();
  const rawUrl = process.env.SHADOWFAX_API_URL ?? '';
  const host = safeUrlHost(rawUrl);
  const token = tokenForMode(mode);
  const isDaleMode = mode === 'dale_staging' || mode === 'dale_production';
  const query = new URLSearchParams({
    service: 'customer_delivery',
    page: '1',
    count: '10',
    pincodes: serviceabilityPincode(),
  });
  const endpoint = isDaleMode
    ? `/api/v1/clients/serviceability/?${query.toString()}`
    : mode === 'legacy' || mode === 'hl_staging'
      ? '/api/v1/order-serviceability/'
      : mode === 'flash'
        ? '/order/serviceability/'
        : '/v3/clients/serviceability/';
  const base = normalizeShadowfaxApiBase(rawUrl, mode);
  const body = isDaleMode
    ? undefined
    : mode === 'legacy' || mode === 'hl_staging'
      ? {
          pickup_longitude: String(process.env.SHADOWFAX_TEST_PICKUP_LNG ?? 77.209),
          pickup_latitude: String(process.env.SHADOWFAX_TEST_PICKUP_LAT ?? 28.6139),
          drop_latitude: String(process.env.SHADOWFAX_TEST_DROPOFF_LAT ?? 28.62),
          drop_longitude: String(process.env.SHADOWFAX_TEST_DROPOFF_LNG ?? 77.22),
          paid: 'true',
          COID: `JD-DIAG-${Date.now()}`,
          stage_of_check: 'pre_order',
          order_value: 1,
          rain_flag: false,
          client_surge: 0,
        }
      : mode === 'flash'
        ? {
            pickup_details: { latitude: Number(process.env.SHADOWFAX_TEST_PICKUP_LAT ?? 28.6139), longitude: Number(process.env.SHADOWFAX_TEST_PICKUP_LNG ?? 77.209) },
            drop_details: { latitude: Number(process.env.SHADOWFAX_TEST_DROPOFF_LAT ?? 28.62), longitude: Number(process.env.SHADOWFAX_TEST_DROPOFF_LNG ?? 77.22) },
          }
        : {
            pickup_lat: Number(process.env.SHADOWFAX_TEST_PICKUP_LAT ?? 28.6139),
            pickup_lng: Number(process.env.SHADOWFAX_TEST_PICKUP_LNG ?? 77.209),
            drop_lat: Number(process.env.SHADOWFAX_TEST_DROPOFF_LAT ?? 28.62),
            drop_lng: Number(process.env.SHADOWFAX_TEST_DROPOFF_LNG ?? 77.22),
            weight_g: Number(process.env.SHADOWFAX_TEST_WEIGHT_G ?? 500),
          };
  const method = isDaleMode ? 'GET' : mode === 'legacy' || mode === 'hl_staging' ? 'PUT' : 'POST';
  try {
    const response = await fetch(`${base}${endpoint}`, {
      method,
      headers: {
        Authorization: mode === 'flash' ? String(token ?? '') : `Token ${token ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12000),
    });
    const data = await readProviderBody(response);
    printResult(response.status >= 200 && response.status < 400, 'Shadowfax diagnostic probe completed', {
      host,
      mode,
      endpointPath: endpoint,
      method,
      authHeaderPresent: token ? 'YES' : 'NO',
      authScheme: mode === 'flash' ? 'raw' : 'Token',
      tokenPresent: token ? 'YES' : 'NO',
      payloadKeys: body ? Object.keys(body) : [],
      httpStatus: response.status,
      providerMessage: providerMessage(data),
    });
    return response.status >= 200 && response.status < 400 ? 0 : 1;
  } catch (err) {
    printResult(false, 'Shadowfax diagnostic probe failed', {
      host,
      mode,
      endpointPath: endpoint,
      method,
      authHeaderPresent: token ? 'YES' : 'NO',
      authScheme: mode === 'flash' ? 'raw' : 'Token',
      tokenPresent: token ? 'YES' : 'NO',
      payloadKeys: body ? Object.keys(body) : [],
      httpStatus: 'NETWORK_ERROR',
      providerMessage: err instanceof Error ? err.message : 'Unknown error',
    });
    return 1;
  }
}

async function runTestShipment(): Promise<number> {
  if (process.env.SHADOWFAX_ALLOW_TEST_ORDER !== 'true') {
    printResult(false, 'Refusing to create a test shipment without SHADOWFAX_ALLOW_TEST_ORDER=true');
    return 1;
  }
  if (process.env.NODE_ENV === 'production') {
    printResult(false, 'Refusing to create a test shipment while NODE_ENV=production');
    return 1;
  }
  const client = assertBaseConfig('test-shipment');
  if (!client) return 1;
  try {
    const result = await client.createShipment({
      order_details: {
        client_order_id: `JD-TEST-${Date.now()}`,
        paid: true,
        payment_mode: 'PREPAID',
        order_value: 1,
        pickup_details: {
          name: 'JebDekho Test Pickup',
          contact: process.env.SHADOWFAX_TEST_PICKUP_PHONE ?? '9999999999',
          address_line_1: process.env.SHADOWFAX_TEST_PICKUP_ADDRESS ?? 'Test pickup address',
          city: process.env.SHADOWFAX_TEST_PICKUP_CITY ?? 'New Delhi',
          state: process.env.SHADOWFAX_TEST_PICKUP_STATE ?? 'Delhi',
          pincode: process.env.SHADOWFAX_TEST_PICKUP_PINCODE ?? '110001',
          latitude: Number(process.env.SHADOWFAX_TEST_PICKUP_LAT ?? 28.6139),
          longitude: Number(process.env.SHADOWFAX_TEST_PICKUP_LNG ?? 77.209),
        },
        drop_details: {
          name: 'JebDekho Test Customer',
          contact: process.env.SHADOWFAX_TEST_DROPOFF_PHONE ?? '9999999998',
          address_line_1: process.env.SHADOWFAX_TEST_DROPOFF_ADDRESS ?? 'Test drop address',
          city: process.env.SHADOWFAX_TEST_DROPOFF_CITY ?? 'New Delhi',
          state: process.env.SHADOWFAX_TEST_DROPOFF_STATE ?? 'Delhi',
          pincode: process.env.SHADOWFAX_TEST_DROPOFF_PINCODE ?? '110002',
          latitude: Number(process.env.SHADOWFAX_TEST_DROPOFF_LAT ?? 28.62),
          longitude: Number(process.env.SHADOWFAX_TEST_DROPOFF_LNG ?? 77.22),
        },
      },
    });
    printResult(true, 'Shadowfax test shipment created', {
      providerResponseKeys: Object.keys(result),
    });
    return 0;
  } catch (err) {
    printResult(false, 'Shadowfax test shipment failed', {
      message: err instanceof Error ? err.message : 'Unknown error',
    });
    return 1;
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] as Command | undefined;
  let code = 1;
  if (command === 'health') code = await runHealth();
  else if (command === 'serviceability') code = await runServiceability();
  else if (command === 'test-shipment') code = await runTestShipment();
  else if (command === 'diagnose') code = await runDiagnose();
  else {
    printResult(false, 'Usage: pnpm shadowfax:health | pnpm shadowfax:serviceability | pnpm shadowfax:diagnose | SHADOWFAX_ALLOW_TEST_ORDER=true pnpm shadowfax:test-shipment');
  }
  process.exitCode = code;
}

void main();
