import { ConfigService } from '@nestjs/config';
import { DeliveryProviderType, ShipmentProviderStatus } from '@prisma/client';
import { LogisticsProviderError } from '../../errors/logistics.errors';
import type { CreateShipmentInput } from '../../interfaces/logistics-provider.interface';
import { BorzoClient, borzoErrorMessage } from './borzo.client';
import { BorzoProvider } from './borzo.provider';

const client = {
  createOrder: jest.fn(),
  cancelOrder: jest.fn(),
  getOrder: jest.fn(),
  getCourier: jest.fn(),
  calculateOrder: jest.fn(),
  healthCheck: jest.fn(),
} as unknown as jest.Mocked<BorzoClient>;

const config = {
  get: <T>(key: string, fallback?: T) =>
    (({ BORZO_VEHICLE_TYPE_ID: 8, BORZO_DEFAULT_MATTER: 'Grocery & retail order' }) as Record<string, unknown>)[
      key
    ] ?? fallback,
} as unknown as ConfigService;

const provider = new BorzoProvider(client, config);

function shipmentInput(overrides: Partial<CreateShipmentInput> = {}): CreateShipmentInput {
  return {
    orderId: 'order-1',
    orderNumber: 'JD-20260711-TEST',
    pickup: {
      name: 'JebDekho Store',
      phone: '9876543210',
      line1: 'Saket',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110017',
      lat: 28.5235,
      lng: 77.2045,
    },
    dropoff: {
      name: 'Rahul',
      phone: '09984412354',
      line1: 'Janakpuri',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110058',
      lat: 28.621,
      lng: 77.0817,
    },
    items: [{ name: 'Aata 5kg', quantity: 1, unitPrice: 250, totalPrice: 250 }],
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('BorzoProvider.createShipment', () => {
  it('builds a two-point order, normalizes phones, and returns the order id', async () => {
    client.createOrder.mockResolvedValue({
      is_successful: true,
      order: {
        order_id: 1250032,
        order_name: '50032',
        status: 'available',
        payment_amount: '170.00',
        points: [{ address: 'Saket' }, { address: 'Janakpuri', tracking_url: 'https://trk/50032' }],
      },
    });

    const result = await provider.createShipment(shipmentInput());

    const payload = client.createOrder.mock.calls[0][0];
    expect(payload.points).toHaveLength(2);
    expect(payload.points[0].contact_person.phone).toBe('919876543210');
    expect(payload.points[1].contact_person.phone).toBe('919984412354'); // 0-prefixed → 91
    expect(payload.matter).toBe('Aata 5kg');

    expect(result).toMatchObject({
      externalShipmentId: '1250032',
      trackingNumber: '50032',
      deliveryCost: 170,
      normalizedStatus: ShipmentProviderStatus.PENDING,
      labelUrl: 'https://trk/50032',
    });
  });

  it('adds COD fields to the drop point when a COD amount is present', async () => {
    client.createOrder.mockResolvedValue({
      is_successful: true,
      order: { order_id: 5, order_name: '5', status: 'available', points: [{}, {}] },
    });

    await provider.createShipment(shipmentInput({ codAmount: 499 }));

    const drop = client.createOrder.mock.calls[0][0].points[1];
    expect(drop.taking_amount).toBe('499.00');
    expect(drop.is_cod_cash_voucher_required).toBe(true);
  });

  it('throws when Borzo returns no order_id', async () => {
    client.createOrder.mockResolvedValue({ is_successful: true, order: {} });
    await expect(provider.createShipment(shipmentInput())).rejects.toBeInstanceOf(LogisticsProviderError);
  });
});

describe('BorzoProvider.trackShipment', () => {
  it('prefers the granular delivery status and surfaces courier location', async () => {
    client.getOrder.mockResolvedValue({
      is_successful: true,
      orders: [
        {
          order_id: 1250032,
          order_name: '50032',
          status: 'active',
          courier: { name: 'Amit', surname: 'K', phone: '918880000001', latitude: 28.62, longitude: 77.08 },
          points: [{ address: 'Saket' }, { address: 'Janakpuri', delivery: { status: 'parcel_picked_up' } }],
        },
      ],
    });

    const track = await provider.trackShipment('1250032');

    expect(track.providerStatus).toBe('parcel_picked_up');
    expect(track.normalizedStatus).toBe(ShipmentProviderStatus.PICKED_UP);
    expect(track.driverName).toBe('Amit K');
    expect(track.lat).toBe(28.62);
    expect(track.lng).toBe(77.08);
  });
});

describe('BorzoProvider.type', () => {
  it('reports BORZO', () => {
    expect(provider.type).toBe(DeliveryProviderType.BORZO);
  });
});

describe('borzoErrorMessage', () => {
  it('flattens errors and nested parameter_errors', () => {
    const msg = borzoErrorMessage({
      is_successful: false,
      errors: ['invalid_parameters'],
      parameter_errors: {
        matter: ['required'],
        points: [null, { contact_person: { phone: ['required'] } }],
      },
    });
    expect(msg).toContain('invalid_parameters');
    expect(msg).toContain('matter: required');
    expect(msg).toContain('points.1.contact_person.phone: required');
  });
});
