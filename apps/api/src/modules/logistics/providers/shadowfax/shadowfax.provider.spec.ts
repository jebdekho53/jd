import { DeliveryProviderType, ShipmentProviderStatus } from '@prisma/client';
import { LogisticsProviderError } from '../../errors/logistics.errors';
import type { CreateShipmentInput } from '../../interfaces/logistics-provider.interface';
import { ShadowfaxClient } from './shadowfax.client';
import { ShadowfaxProvider } from './shadowfax.provider';

const shadowfaxClient = {
  createShipment: jest.fn(),
  cancelShipment: jest.fn(),
  trackShipment: jest.fn(),
  estimatePrice: jest.fn(),
  healthCheck: jest.fn(),
} as unknown as jest.Mocked<ShadowfaxClient>;

function shipmentInput(): CreateShipmentInput {
  return {
    orderId: 'order-1',
    orderNumber: 'JD-20260701-TEST',
    pickup: {
      name: 'Atharv Legal',
      phone: '9876543210',
      line1: 'Pickup address',
      city: 'Ghaziabad',
      state: 'Uttar Pradesh',
      pincode: '201003',
      lat: 28.67,
      lng: 77.44,
    },
    dropoff: {
      name: 'Customer',
      phone: '9876543211',
      line1: 'Drop address',
      city: 'Ghaziabad',
      state: 'Uttar Pradesh',
      pincode: '201003',
      lat: 28.68,
      lng: 77.45,
    },
    codAmount: 99,
    amounts: {
      subtotal: 100,
      discountAmount: 1,
      deliveryFee: 0,
      taxAmount: 0,
      totalAmount: 99,
      payableAmount: 99,
      productValue: 99,
      declaredValue: 99,
      invoiceValue: 99,
      codAmount: 99,
    },
    package: {
      weightGrams: 500,
      lengthCm: 10,
      breadthCm: 10,
      heightCm: 10,
    },
    items: [
      {
        name: 'Fresh Apples 1 kg',
        sku: 'APL-1KG',
        hsnCode: '08081000',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
        tax: 0,
        discount: 0,
        weightGrams: 500,
      },
    ],
  };
}

function shipmentInputWithAwb(): CreateShipmentInput {
  return {
    ...shipmentInput(),
    awbNumber: 'SF10000001JEB',
  };
}

describe('ShadowfaxProvider', () => {
  let provider: ShadowfaxProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new ShadowfaxProvider(shadowfaxClient);
  });

  it('maps top-level AWB as the external shipment and tracking number', async () => {
    shadowfaxClient.createShipment.mockResolvedValueOnce({
      awb_number: 'SF610198449AAA',
      status: 'new',
      delivery_charge: 42,
    });

    const result = await provider.createShipment(shipmentInput());

    expect(result.externalShipmentId).toBe('SF610198449AAA');
    expect(result.trackingNumber).toBe('SF610198449AAA');
    expect(result.providerStatus).toBe('new');
    expect(result.normalizedStatus).toBe(ShipmentProviderStatus.PENDING);
    expect(result.deliveryCost).toBe(42);
    expect(shadowfaxClient.createShipment).toHaveBeenCalledWith(
      expect.objectContaining({
        order_details: expect.objectContaining({
          client_order_id: 'JD-20260701-TEST',
          paid: false,
          payment_mode: 'COD',
          order_value: 99,
          product_value: 99,
          declared_value: 99,
          invoice_value: 99,
          payable_amount: 99,
          cod_amount: 99,
          weight: 500,
          length: 10,
        }),
        customer_details: expect.objectContaining({ pincode: '201003' }),
        pickup_details: expect.objectContaining({ pincode: '201003' }),
        rts_details: expect.objectContaining({ pincode: '201003' }),
        product_details: [
          expect.objectContaining({
            product_name: 'Fresh Apples 1 kg',
            sku: 'APL-1KG',
            hsn_code: '08081000',
            quantity: 1,
            product_value: 100,
            item_value: 100,
            unit_price: 100,
          }),
        ],
      }),
    );
  });

  it('uses safe positive minimum product value when order amount data is zero', async () => {
    shadowfaxClient.createShipment.mockResolvedValueOnce({
      awb_number: 'SFMIN123',
      status: 'new',
    });

    const input = {
      ...shipmentInput(),
      codAmount: undefined,
      amounts: {
        subtotal: 0,
        discountAmount: 0,
        deliveryFee: 0,
        taxAmount: 0,
        totalAmount: 0,
        payableAmount: 0,
        productValue: 0,
        declaredValue: 0,
        invoiceValue: 0,
        codAmount: 0,
      },
      items: [],
    };

    await provider.createShipment(input);

    expect(shadowfaxClient.createShipment).toHaveBeenCalledWith(
      expect.objectContaining({
        order_details: expect.objectContaining({
          paid: true,
          payment_mode: 'PREPAID',
          order_value: 1,
          product_value: 1,
          declared_value: 1,
          invoice_value: 1,
          payable_amount: 1,
          cod_amount: 0,
        }),
        product_details: [
          expect.objectContaining({
            product_name: 'JebDekho order',
            product_value: 1,
            item_value: 1,
          }),
        ],
      }),
    );
  });

  it('sends preallocated AWB and uses it when Shadowfax success response omits an identifier', async () => {
    shadowfaxClient.createShipment.mockResolvedValueOnce({
      message: 'Success',
      data: {
        status: 'new',
      },
    });

    const result = await provider.createShipment(shipmentInputWithAwb());

    expect(result.externalShipmentId).toBe('SF10000001JEB');
    expect(result.trackingNumber).toBe('SF10000001JEB');
    expect(shadowfaxClient.createShipment).toHaveBeenCalledWith(
      expect.objectContaining({
        order_details: expect.objectContaining({
          awb_number: 'SF10000001JEB',
        }),
      }),
    );
  });

  it('does not mask Shadowfax failure bodies with a preallocated AWB fallback', async () => {
    shadowfaxClient.createShipment.mockResolvedValueOnce({
      message: 'Failure',
      errors: 'Invalid AWB',
    });

    await expect(provider.createShipment(shipmentInputWithAwb())).rejects.toMatchObject({
      name: 'LogisticsProviderError',
      providerType: DeliveryProviderType.SHADOWFAX,
      code: 'SHADOWFAX_CREATE_FAILED',
      providerMessage: 'Failure: Invalid AWB',
    } satisfies Partial<LogisticsProviderError>);
  });

  it('maps nested marketplace create responses inside data arrays', async () => {
    shadowfaxClient.createShipment.mockResolvedValueOnce({
      message: 'Success',
      data: [
        {
          awb_number: 'SFARRAY123',
          status_id: 'assigned_for_seller_pickup',
          eta_minutes: '25',
        },
      ],
    });

    const result = await provider.createShipment(shipmentInput());

    expect(result.externalShipmentId).toBe('SFARRAY123');
    expect(result.trackingNumber).toBe('SFARRAY123');
    expect(result.providerStatus).toBe('assigned_for_seller_pickup');
    expect(result.estimatedEtaMins).toBe(25);
  });

  it('maps nested camelCase identifiers from wrapped responses', async () => {
    shadowfaxClient.createShipment.mockResolvedValueOnce({
      message: 'Success',
      result: {
        order: {
          awbNumber: 'SFCAMEL456',
          trackingId: 'TRK456',
          status: 'assigned',
        },
      },
    });

    const result = await provider.createShipment(shipmentInput());

    expect(result.externalShipmentId).toBe('SFCAMEL456');
    expect(result.trackingNumber).toBe('SFCAMEL456');
    expect(result.providerStatus).toBe('assigned');
    expect(result.normalizedStatus).toBe(ShipmentProviderStatus.ASSIGNED);
  });

  it('fails shipment creation when Shadowfax returns 200 without any identifier', async () => {
    shadowfaxClient.createShipment.mockResolvedValueOnce({
      message: 'Success',
      data: {
        status: 'new',
      },
    });

    await expect(provider.createShipment(shipmentInput())).rejects.toMatchObject({
      name: 'LogisticsProviderError',
      providerType: DeliveryProviderType.SHADOWFAX,
      code: 'MISSING_SHIPMENT_IDENTIFIER',
      retryable: false,
    } satisfies Partial<LogisticsProviderError>);
  });
});
