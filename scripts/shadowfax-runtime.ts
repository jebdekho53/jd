import { ShadowfaxClient } from '../apps/api/src/modules/logistics/providers/shadowfax/shadowfax.client';
import type { ConfigService } from '@nestjs/config';
import { loadRuntimeEnv, present, safeUrlHost } from './runtime-env';

type Command = 'health' | 'serviceability' | 'test-shipment';

loadRuntimeEnv();

class EnvConfig {
  get<T = string>(key: string, fallback?: T): T {
    if (key === 'NODE_ENV') return 'development' as T;
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
  };
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
  if (!process.env.SHADOWFAX_TEST_TOKEN) {
    printResult(false, 'SHADOWFAX_TEST_TOKEN is not configured', configSummary());
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
  else {
    printResult(false, 'Usage: pnpm shadowfax:health | pnpm shadowfax:serviceability | SHADOWFAX_ALLOW_TEST_ORDER=true pnpm shadowfax:test-shipment');
  }
  process.exitCode = code;
}

void main();
