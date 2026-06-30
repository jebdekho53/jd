import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ShadowfaxClient, type ShadowfaxCreatePayload } from './shadowfax.client';

jest.mock('axios');

const mockHttp = {
  get: jest.fn(),
  post: jest.fn(),
  request: jest.fn(),
};

const mockedAxios = axios as jest.Mocked<typeof axios>;

function config(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
  } as unknown as ConfigService;
}

function payload(overrides: Partial<ShadowfaxCreatePayload['order_details']> = {}): ShadowfaxCreatePayload {
  return {
    order_details: {
      client_order_id: 'JD-20260629-TEST',
      paid: true,
      pickup_details: {
        name: 'Atharv Legal',
        contact: '9876543210',
        address_line_1: 'Pickup',
        city: 'Pune',
        pincode: '411001',
        latitude: 18.52,
        longitude: 73.85,
      },
      drop_details: {
        name: 'Customer',
        contact: '9876543211',
        address_line_1: 'Drop',
        city: 'Pune',
        pincode: '411002',
        latitude: 18.53,
        longitude: 73.86,
      },
      ...overrides,
    },
  };
}

describe('ShadowfaxClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockHttp as any);
    mockHttp.post.mockResolvedValue({ data: { data: { shipment_id: 'sfx-1' } }, status: 200 });
  });

  it('sets Authorization header from raw production token', () => {
    new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
      }),
    );

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token raw-token-123',
        }),
      }),
    );
  });

  it('uses marketplace create endpoint by default', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
      }),
    );

    const requestPayload = payload();

    await client.createShipment(requestPayload);

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://dale.shadowfax.in/api' }),
    );
    expect(mockHttp.post).toHaveBeenCalledWith(
      '/v3/clients/orders/',
      expect.objectContaining({
        order_details: expect.objectContaining({ payment_mode: 'PREPAID' }),
      }),
    );
  });

  it('uses warehouse create endpoint only when explicitly configured', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_API_MODE: 'v3_warehouse',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
      }),
    );

    const requestPayload = payload();

    await client.createShipment(requestPayload);

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/v3/clients/shipments/',
      expect.objectContaining({
        order_details: expect.objectContaining({ payment_mode: 'PREPAID' }),
      }),
    );
  });

  it('sends PREPAID payment mode for prepaid marketplace orders', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
      }),
    );

    await client.createShipment(payload({ paid: true, order_value: undefined }));

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/v3/clients/orders/',
      expect.objectContaining({
        order_details: expect.objectContaining({
          paid: true,
          payment_mode: 'PREPAID',
        }),
      }),
    );
  });

  it('sends COD payment mode for COD marketplace orders', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
      }),
    );

    await client.createShipment(payload({ paid: false, order_value: 499 }));

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/v3/clients/orders/',
      expect.objectContaining({
        order_details: expect.objectContaining({
          paid: false,
          order_value: 499,
          payment_mode: 'COD',
        }),
      }),
    );
  });

  it('runs serviceability without creating a shipment', async () => {
    mockHttp.post.mockResolvedValue({ data: { charge: 45, eta_minutes: 30 }, status: 200 });
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'development',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_TEST_TOKEN: 'test-token-123',
      }),
    );

    await client.estimatePrice({
      pickup_lat: 28.61,
      pickup_lng: 77.2,
      drop_lat: 28.62,
      drop_lng: 77.21,
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/v3/clients/serviceability/',
      expect.objectContaining({
        pickup_lat: 28.61,
        drop_lng: 77.21,
      }),
    );
    expect(mockHttp.post).not.toHaveBeenCalledWith('/v3/clients/orders/', expect.anything());
  });

  it('surfaces serviceability failures', async () => {
    mockHttp.post.mockRejectedValue({ response: { status: 400, data: { message: 'bad request' } } });
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'development',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_TEST_TOKEN: 'test-token-123',
      }),
    );

    await expect(
      client.estimatePrice({
        pickup_lat: 28.61,
        pickup_lng: 77.2,
        drop_lat: 28.62,
        drop_lng: 77.21,
      }),
    ).rejects.toThrow('Shadowfax API failed: bad request');
  });

  it('does not build a double /api/api base URL', () => {
    new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api/api',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
      }),
    );

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://dale.shadowfax.in/api' }),
    );
  });

  it('reports healthy when health endpoint returns success', async () => {
    mockHttp.request.mockResolvedValue({ status: 200, data: {} });
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'development',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_TEST_TOKEN: 'test-token-123',
      }),
    );

    await expect(client.healthCheck()).resolves.toEqual(
      expect.objectContaining({ healthy: true }),
    );
  });

  it('reports unhealthy when health endpoint returns an error status', async () => {
    mockHttp.request.mockResolvedValue({ status: 503, data: {} });
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'development',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_TEST_TOKEN: 'test-token-123',
      }),
    );

    await expect(client.healthCheck()).resolves.toEqual(
      expect.objectContaining({
        healthy: false,
        message: 'Shadowfax health returned HTTP 503',
      }),
    );
  });
});
