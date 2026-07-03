import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ShadowfaxClient, type ShadowfaxCreatePayload } from './shadowfax.client';

jest.mock('axios');

const mockHttp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
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
    mockHttp.get.mockResolvedValue({ data: { results: [{ pincode: '110001', serviceable: true }] }, status: 200 });
    mockHttp.post.mockResolvedValue({ data: { data: { shipment_id: 'sfx-1' } }, status: 200 });
    mockHttp.put.mockResolvedValue({ data: { serviceable: true, delivery_cost: 42 }, status: 200 });
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

  it('does not send malformed Token-prefixed env values to Shadowfax', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_API_MODE: 'v3_marketplace',
        SHADOWFAX_PRODUCTION_TOKEN: 'Token raw-token-123',
      }),
    );

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: undefined,
        }),
      }),
    );
    await expect(client.createShipment(payload())).rejects.toThrow(
      'Shadowfax token env must contain the raw token only',
    );
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it('does not send bare Token env values to Shadowfax', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_API_MODE: 'v3_marketplace',
        SHADOWFAX_PRODUCTION_TOKEN: 'Token',
      }),
    );

    await expect(client.createShipment(payload())).rejects.toThrow(
      'Shadowfax token env must contain the raw token only',
    );
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it('uses production token for production marketplace even when a test token exists', () => {
    new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_API_MODE: 'v3_marketplace',
        SHADOWFAX_TEST_TOKEN: 'test-token-123',
        SHADOWFAX_PRODUCTION_TOKEN: 'prod-token-123',
      }),
    );

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token prod-token-123',
        }),
      }),
    );
  });

  it('falls back to production token for staging modes when test token is missing', () => {
    new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://hlbackend.staging.shadowfax.in',
        SHADOWFAX_API_MODE: 'hl_staging',
        SHADOWFAX_PRODUCTION_TOKEN: 'prod-token-123',
      }),
    );

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token prod-token-123',
        }),
      }),
    );
  });

  it('uses Dale create endpoint for the verified production Dale host', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
      }),
    );

    const requestPayload = payload();

    await client.createShipment(requestPayload);

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://dale.shadowfax.in' }),
    );
    expect(mockHttp.post).toHaveBeenCalledWith(
      '/api/v3/clients/orders/',
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
        SHADOWFAX_API_MODE: 'v3_marketplace',
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
        SHADOWFAX_API_MODE: 'v3_marketplace',
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

  it('uses documented v1 serviceability endpoint for marketplace mode', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api',
        SHADOWFAX_API_MODE: 'v3_marketplace',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
        SHADOWFAX_TEST_PINCODE: '560016',
      }),
    );

    await client.estimatePrice({
      pickup_lat: 28.61,
      pickup_lng: 77.2,
      drop_lat: 28.62,
      drop_lng: 77.21,
      pincode: '560016',
    });

    expect(mockHttp.get).toHaveBeenCalledWith(
      '/v1/clients/serviceability/?service=customer_delivery&page=1&count=10&pincodes=560016',
    );
    expect(mockHttp.post).not.toHaveBeenCalledWith('/v3/clients/serviceability/', expect.anything());
  });

  it('runs Dale serviceability with the verified GET pincode endpoint without creating a shipment', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'development',
        SHADOWFAX_API_URL: 'https://dale.staging.shadowfax.in',
        SHADOWFAX_API_MODE: 'dale_staging',
        SHADOWFAX_TEST_TOKEN: 'test-token-123',
        SHADOWFAX_TEST_PINCODE: '122001',
      }),
    );

    await client.estimatePrice({
      pickup_lat: 28.61,
      pickup_lng: 77.2,
      drop_lat: 28.62,
      drop_lng: 77.21,
      pincode: '122001',
    });

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://dale.staging.shadowfax.in',
        headers: expect.objectContaining({ Authorization: 'Token test-token-123' }),
      }),
    );
    expect(mockHttp.get).toHaveBeenCalledWith(
      '/api/v1/clients/serviceability/?service=customer_delivery&page=1&count=10&pincodes=122001',
    );
    expect(mockHttp.post).not.toHaveBeenCalledWith('/api/v3/clients/orders/', expect.anything());
  });





  it('uses test token and documented payload for HL staging serviceability', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://hlbackend.staging.shadowfax.in',
        SHADOWFAX_API_MODE: 'hl_staging',
        SHADOWFAX_TEST_TOKEN: 'test-token-123',
        SHADOWFAX_PRODUCTION_TOKEN: 'prod-token-123',
      }),
    );

    await client.estimatePrice({
      pickup_lat: 28.61,
      pickup_lng: 77.2,
      drop_lat: 28.62,
      drop_lng: 77.21,
    });

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://hlbackend.staging.shadowfax.in',
        headers: expect.objectContaining({ Authorization: 'Token test-token-123' }),
      }),
    );
    expect(mockHttp.put).toHaveBeenCalledWith(
      '/api/v1/order-serviceability/',
      expect.objectContaining({
        pickup_longitude: '77.2',
        drop_latitude: '28.62',
        drop_longitude: '77.21',
        pickup_latitude: '28.61',
        paid: 'true',
        stage_of_check: 'pre_order',
        order_value: 1,
        rain_flag: false,
        client_surge: 0,
      }),
    );
  });

  it('uses documented legacy serviceability endpoint without creating a shipment', async () => {
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://api.shadowfax.in',
        SHADOWFAX_API_MODE: 'legacy',
        SHADOWFAX_PRODUCTION_TOKEN: 'raw-token-123',
      }),
    );

    await client.estimatePrice({
      pickup_lat: 28.61,
      pickup_lng: 77.2,
      drop_lat: 28.62,
      drop_lng: 77.21,
    });

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://api.shadowfax.in' }),
    );
    expect(mockHttp.put).toHaveBeenCalledWith(
      '/api/v1/order-serviceability/',
      expect.objectContaining({
        pickup_latitude: '28.61',
        pickup_longitude: '77.2',
        drop_latitude: '28.62',
        drop_longitude: '77.21',
        stage_of_check: 'pre_order',
      }),
    );
    expect(mockHttp.post).not.toHaveBeenCalledWith('/api/v2/orders/', expect.anything());
  });

  it('surfaces serviceability failures', async () => {
    mockHttp.get.mockRejectedValue({ response: { status: 400, data: { message: 'bad request' } } });
    const client = new ShadowfaxClient(
      config({
        NODE_ENV: 'development',
        SHADOWFAX_API_URL: 'https://dale.staging.shadowfax.in',
        SHADOWFAX_API_MODE: 'dale_staging',
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

  it('does not build a double /api/api base URL for explicit V3 mode', () => {
    new ShadowfaxClient(
      config({
        NODE_ENV: 'production',
        SHADOWFAX_API_URL: 'https://dale.shadowfax.in/api/api',
        SHADOWFAX_API_MODE: 'v3_marketplace',
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
        SHADOWFAX_API_URL: 'https://dale.staging.shadowfax.in',
        SHADOWFAX_API_MODE: 'dale_staging',
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
        SHADOWFAX_API_URL: 'https://dale.staging.shadowfax.in',
        SHADOWFAX_API_MODE: 'dale_staging',
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
