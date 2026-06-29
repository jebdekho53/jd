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

function payload(): ShadowfaxCreatePayload {
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

    await client.createShipment(payload());

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://dale.shadowfax.in/api' }),
    );
    expect(mockHttp.post).toHaveBeenCalledWith('/v3/clients/orders/', payload());
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

    await client.createShipment(payload());

    expect(mockHttp.post).toHaveBeenCalledWith('/v3/clients/shipments/', payload());
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
});
