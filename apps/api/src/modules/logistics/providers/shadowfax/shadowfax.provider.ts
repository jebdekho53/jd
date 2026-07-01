import { Injectable, Logger } from '@nestjs/common';
import { DeliveryProviderType, ShipmentProviderStatus } from '@prisma/client';
import type {
  CreateShipmentInput,
  ILogisticsProvider,
  PriceEstimateInput,
  PriceEstimateResult,
  ProofOfDeliveryResult,
  ProviderHealthResult,
  ShipmentResult,
  TrackShipmentResult,
} from '../../interfaces/logistics-provider.interface';
import { LogisticsProviderError } from '../../errors/logistics.errors';
import { mapShadowfaxStatus } from '../../mappers/shadowfax-status.mapper';
import { ShadowfaxClient, type ShadowfaxCreatePayload, type ShadowfaxProductPayload } from './shadowfax.client';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function positiveAmount(value: number | null | undefined, fallback = 1): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback;
  return Number(value.toFixed(2));
}

function positiveInteger(value: number | null | undefined, fallback = 1): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(fallback, Math.round(value));
}

function findNumberByKeys(value: unknown, keys: string[]): number | undefined {
  const seen = new Set<unknown>();
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (typeof current !== 'object') continue;
    const row = current as Record<string, unknown>;
    for (const key of keys) {
      const found = asNumber(row[key]);
      if (found != null) return found;
    }
    queue.push(...Object.values(row));
  }

  return undefined;
}

function findStringByKeys(value: unknown, keys: string[]): string | undefined {
  const seen = new Set<unknown>();
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (typeof current !== 'object') continue;
    const row = current as Record<string, unknown>;
    for (const key of keys) {
      const found = asString(row[key]);
      if (found) return found;
    }
    queue.push(...Object.values(row));
  }

  return undefined;
}

function primaryResponseRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const candidates = [
    raw.data,
    raw.result,
    raw.results,
    raw.response,
    raw.order,
    raw.shipment,
    raw,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const first = candidate.find((item) => item && typeof item === 'object');
      if (first) return asRecord(first);
    }
    const row = asRecord(candidate);
    if (Object.keys(row).length > 0) return row;
  }
  return {};
}

function shadowfaxFailureMessage(raw: Record<string, unknown>): string | undefined {
  const message = findStringByKeys(raw, ['message', 'detail']);
  const errors = findStringByKeys(raw, ['errors', 'error']);
  const success = raw.success;
  if (typeof success === 'boolean' && !success) {
    return errors ?? message ?? 'Shadowfax returned unsuccessful response';
  }
  if (message?.trim().toLowerCase() === 'failure') {
    return errors ? `${message}: ${errors}` : message;
  }
  return undefined;
}

@Injectable()
export class ShadowfaxProvider implements ILogisticsProvider {
  readonly type = DeliveryProviderType.SHADOWFAX;
  private readonly logger = new Logger(ShadowfaxProvider.name);

  constructor(private readonly client: ShadowfaxClient) {}

  async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const payload = this.toCreatePayload(input);
    const missingFields = this.missingMarketplaceFields(payload);
    this.logger.log(
      {
        orderId: input.orderId,
        payloadKeys: this.payloadKeys(payload),
        productCount: payload.product_details?.length ?? 0,
        missingFields,
      },
      'Shadowfax marketplace create payload prepared',
    );
    if (missingFields.length > 0) {
      throw new LogisticsProviderError(
        `Shadowfax payload missing required fields: ${missingFields.join(', ')}`,
        DeliveryProviderType.SHADOWFAX,
        'SHADOWFAX_PAYLOAD_INVALID',
        false,
        undefined,
        { providerMessage: `Missing required fields: ${missingFields.join(', ')}` },
      );
    }

    const raw = await this.client.createShipment(payload);

    const failureMessage = shadowfaxFailureMessage(raw);
    if (failureMessage) {
      throw new LogisticsProviderError(
        `Shadowfax API failed: ${failureMessage}`,
        DeliveryProviderType.SHADOWFAX,
        'SHADOWFAX_CREATE_FAILED',
        false,
        undefined,
        { providerMessage: failureMessage },
      );
    }

    const data = primaryResponseRecord(raw);
    const awbNumber = findStringByKeys(raw, ['awb_number', 'awbNumber', 'awb', 'AWB']);
    const shadowfaxOrderId = findStringByKeys(raw, ['sfx_order_id', 'sfxOrderId', 'shadowfax_order_id']);
    const shipmentId = findStringByKeys(raw, ['shipment_id', 'shipmentId', 'id']);
    const trackingId = findStringByKeys(raw, ['tracking_id', 'trackingId', 'tracking_number', 'trackingNumber']);
    const externalShipmentId =
      awbNumber ??
      shadowfaxOrderId ??
      shipmentId ??
      trackingId ??
      input.awbNumber ??
      '';
    const trackingNumber =
      awbNumber ??
      trackingId ??
      shadowfaxOrderId ??
      externalShipmentId;
    if (!externalShipmentId) {
      throw new LogisticsProviderError(
        'Shadowfax create order response did not include AWB/tracking identifier',
        DeliveryProviderType.SHADOWFAX,
        'MISSING_SHIPMENT_IDENTIFIER',
        false,
        undefined,
        { providerMessage: 'Missing awb_number/tracking_id/sfx_order_id in Shadowfax response' },
      );
    }
    const providerStatus =
      findStringByKeys(raw, ['status_id', 'status']) ??
      'new';
    const etaMins = findNumberByKeys(raw, ['estimated_delivery_time', 'eta_minutes']);

    return {
      externalShipmentId,
      trackingNumber,
      estimatedEtaMins: etaMins,
      estimatedArrivalAt: etaMins ? new Date(Date.now() + etaMins * 60_000) : undefined,
      deliveryCost: findNumberByKeys(raw, ['delivery_charge', 'charge']),
      providerStatus,
      normalizedStatus: mapShadowfaxStatus(providerStatus),
      driverName: asString(data.rider_name) ?? asString(asRecord(data.rider).name),
      driverPhone: asString(data.rider_phone) ?? asString(asRecord(data.rider).phone),
      vehicleType: asString(data.vehicle_type) ?? asString(asRecord(data.rider).vehicle_type),
      labelUrl: asString(data.label_url),
      rawResponse: raw,
    };
  }

  async cancelShipment(externalShipmentId: string, reason?: string): Promise<void> {
    await this.client.cancelShipment(externalShipmentId, reason);
  }

  async trackShipment(externalShipmentId: string): Promise<TrackShipmentResult> {
    const raw = await this.client.trackShipment(externalShipmentId);
    const data = asRecord(raw.data ?? raw);
    const providerStatus = asString(data.status) ?? asString(data.current_status) ?? 'pending';
    const rider = asRecord(data.rider);
    const etaMins = asNumber(data.estimated_delivery_time) ?? asNumber(data.eta_minutes);
    const timelineRaw = Array.isArray(data.tracking_details) ? data.tracking_details : [];

    return {
      externalShipmentId,
      trackingNumber:
        asString(data.awb_number) ?? asString(data.tracking_id) ?? externalShipmentId,
      providerStatus,
      normalizedStatus: mapShadowfaxStatus(providerStatus),
      estimatedEtaMins: etaMins,
      estimatedArrivalAt: etaMins ? new Date(Date.now() + etaMins * 60_000) : undefined,
      driverName: asString(data.rider_name) ?? asString(rider.name),
      driverPhone: asString(data.rider_phone) ?? asString(rider.phone),
      vehicleType: asString(data.vehicle_type) ?? asString(rider.vehicle_type),
      lat: asNumber(data.latitude) ?? asNumber(rider.latitude),
      lng: asNumber(data.longitude) ?? asNumber(rider.longitude),
      timeline: timelineRaw.map((item) => {
        const row = asRecord(item);
        const statusRaw = asString(row.status) ?? asString(row.event);
        return {
          status: mapShadowfaxStatus(statusRaw),
          description: asString(row.description) ?? statusRaw,
          occurredAt: row.timestamp ? new Date(String(row.timestamp)) : new Date(),
        };
      }),
      rawResponse: raw,
    };
  }

  async estimatePrice(input: PriceEstimateInput): Promise<PriceEstimateResult> {
    const raw = await this.client.estimatePrice({
      pickup_lat: input.pickupLat,
      pickup_lng: input.pickupLng,
      drop_lat: input.dropoffLat,
      drop_lng: input.dropoffLng,
      weight_g: input.weightGrams,
    });
    const data = asRecord(raw.data ?? raw);
    return {
      amount: asNumber(data.charge) ?? asNumber(data.delivery_charge) ?? 0,
      currency: asString(data.currency) ?? 'INR',
      estimatedEtaMins: asNumber(data.eta_minutes) ?? asNumber(data.estimated_delivery_time),
    };
  }

  async estimateETA(input: PriceEstimateInput): Promise<{ estimatedMins: number }> {
    const estimate = await this.estimatePrice(input);
    return { estimatedMins: estimate.estimatedEtaMins ?? 30 };
  }

  async getProofOfDelivery(externalShipmentId: string): Promise<ProofOfDeliveryResult> {
    const track = await this.trackShipment(externalShipmentId);
    const raw = track.rawResponse ?? {};
    const data = asRecord(raw.data ?? raw);
    return {
      podUrl: asString(data.pod_url) ?? asString(data.proof_of_delivery),
      deliveredAt: track.normalizedStatus === ShipmentProviderStatus.DELIVERED ? new Date() : undefined,
      signatureUrl: asString(data.signature_url),
    };
  }

  async downloadLabel(externalShipmentId: string): Promise<{ labelUrl: string }> {
    const track = await this.trackShipment(externalShipmentId);
    const labelUrl =
      asString(asRecord(track.rawResponse).label_url) ??
      asString(asRecord(asRecord(track.rawResponse).data).label_url);
    if (!labelUrl) {
      throw new Error('Label not available for this shipment');
    }
    return { labelUrl };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    const result = await this.client.healthCheck();
    return {
      healthy: result.healthy,
      latencyMs: result.latencyMs,
      message: result.message,
    };
  }

  private toAddress(addr: CreateShipmentInput['pickup']) {
    return {
      name: addr.name,
      contact: addr.phone,
      address_line_1: addr.line1,
      address_line_2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      latitude: addr.lat,
      longitude: addr.lng,
    };
  }

  private toCreatePayload(input: CreateShipmentInput): ShadowfaxCreatePayload {
    const pickup = this.toAddress(input.pickup);
    const dropoff = this.toAddress(input.dropoff);
    const amounts = this.resolveAmounts(input);
    const productDetails = this.toProductDetails(input, amounts.productValue);
    const pkg = {
      weightGrams: positiveInteger(input.package?.weightGrams ?? input.weightGrams, 500),
      lengthCm: positiveInteger(input.package?.lengthCm, 10),
      breadthCm: positiveInteger(input.package?.breadthCm, 10),
      heightCm: positiveInteger(input.package?.heightCm, 10),
    };
    const isCod = amounts.codAmount > 0;

    return {
      order_details: {
        client_order_id: input.orderNumber,
        awb_number: input.awbNumber,
        paid: !isCod,
        payment_mode: isCod ? 'COD' : 'PREPAID',
        order_value: amounts.invoiceValue,
        product_value: amounts.productValue,
        declared_value: amounts.declaredValue,
        invoice_value: amounts.invoiceValue,
        payable_amount: amounts.payableAmount,
        cod_amount: amounts.codAmount,
        weight: pkg.weightGrams,
        actual_weight: pkg.weightGrams,
        length: pkg.lengthCm,
        breadth: pkg.breadthCm,
        height: pkg.heightCm,
        pickup_details: pickup,
        drop_details: dropoff,
        order_items: productDetails,
      },
      customer_details: dropoff,
      pickup_details: pickup,
      rts_details: pickup,
      product_details: productDetails,
    };
  }

  private resolveAmounts(input: CreateShipmentInput): {
    productValue: number;
    declaredValue: number;
    invoiceValue: number;
    payableAmount: number;
    codAmount: number;
  } {
    const lineValue = input.items?.reduce((sum, item) => sum + positiveAmount(item.totalPrice), 0) ?? 0;
    const productValue = positiveAmount(input.amounts?.productValue || lineValue || input.amounts?.subtotal || input.amounts?.totalAmount || input.codAmount);
    const invoiceValue = positiveAmount(input.amounts?.invoiceValue || input.amounts?.totalAmount || productValue);
    return {
      productValue,
      declaredValue: positiveAmount(input.amounts?.declaredValue || productValue),
      invoiceValue,
      payableAmount: positiveAmount(input.amounts?.payableAmount || invoiceValue),
      codAmount: Number(Math.max(0, input.amounts?.codAmount ?? input.codAmount ?? 0).toFixed(2)),
    };
  }

  private toProductDetails(input: CreateShipmentInput, fallbackValue: number): ShadowfaxProductPayload[] {
    const items = input.items?.length
      ? input.items
      : [{
        name: 'JebDekho order',
        quantity: 1,
        unitPrice: fallbackValue,
        totalPrice: fallbackValue,
        weightGrams: input.package?.weightGrams ?? input.weightGrams,
      }];

    return items.map((item, index) => {
      const quantity = positiveInteger(item.quantity);
      const totalValue = positiveAmount(item.totalPrice || item.unitPrice * quantity || fallbackValue);
      const unitValue = positiveAmount(item.unitPrice || totalValue / quantity || fallbackValue);
      const name = item.name.trim() || `JebDekho item ${index + 1}`;
      return {
        product_name: name,
        name,
        description: name,
        sku: item.sku,
        hsn_code: item.hsnCode,
        quantity,
        price: unitValue,
        unit_price: unitValue,
        value: totalValue,
        item_value: totalValue,
        product_value: totalValue,
        tax: item.tax,
        discount: item.discount,
        weight: positiveInteger(item.weightGrams ?? input.package?.weightGrams ?? input.weightGrams, 500),
      };
    });
  }

  private missingMarketplaceFields(payload: ShadowfaxCreatePayload): string[] {
    const missing: string[] = [];
    const order = payload.order_details;
    if (!order.client_order_id) missing.push('order_details.client_order_id');
    if (!positiveAmount(order.order_value, 0)) missing.push('order_details.order_value');
    if (!positiveAmount(order.product_value, 0)) missing.push('order_details.product_value');
    if (!positiveAmount(order.declared_value, 0)) missing.push('order_details.declared_value');
    if (!positiveAmount(order.invoice_value, 0)) missing.push('order_details.invoice_value');
    if (!positiveAmount(order.payable_amount, 0)) missing.push('order_details.payable_amount');
    if (!order.payment_mode) missing.push('order_details.payment_mode');
    if (!payload.customer_details) missing.push('customer_details');
    if (!payload.pickup_details) missing.push('pickup_details');
    if (!payload.rts_details) missing.push('rts_details');
    if (!payload.product_details?.length) missing.push('product_details');
    payload.product_details?.forEach((item, index) => {
      if (!item.product_name) missing.push(`product_details.${index}.product_name`);
      if (!positiveInteger(item.quantity, 0)) missing.push(`product_details.${index}.quantity`);
      if (!positiveAmount(item.product_value, 0)) missing.push(`product_details.${index}.product_value`);
      if (!positiveAmount(item.item_value, 0)) missing.push(`product_details.${index}.item_value`);
    });
    return missing;
  }

  private payloadKeys(payload: ShadowfaxCreatePayload): Record<string, unknown> {
    return {
      topLevel: Object.keys(payload).sort(),
      order_details: Object.keys(payload.order_details).sort(),
      customer_details: payload.customer_details ? Object.keys(payload.customer_details).sort() : [],
      pickup_details: payload.pickup_details ? Object.keys(payload.pickup_details).sort() : [],
      rts_details: payload.rts_details ? Object.keys(payload.rts_details).sort() : [],
      product_details: {
        count: payload.product_details?.length ?? 0,
        itemKeys: payload.product_details?.[0] ? Object.keys(payload.product_details[0]).sort() : [],
      },
    };
  }
}
