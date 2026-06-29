import { Injectable } from '@nestjs/common';
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
import { mapShadowfaxStatus } from '../../mappers/shadowfax-status.mapper';
import { ShadowfaxClient } from './shadowfax.client';

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

@Injectable()
export class ShadowfaxProvider implements ILogisticsProvider {
  readonly type = DeliveryProviderType.SHADOWFAX;

  constructor(private readonly client: ShadowfaxClient) {}

  async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const raw = await this.client.createShipment({
      order_details: {
        client_order_id: input.orderNumber,
        paid: !input.codAmount,
        payment_mode: input.codAmount ? 'COD' : 'PREPAID',
        order_value: input.codAmount,
        pickup_details: this.toAddress(input.pickup),
        drop_details: this.toAddress(input.dropoff),
      },
    });

    const data = asRecord(raw.data ?? raw);
    const externalShipmentId =
      asString(data.shipment_id) ??
      asString(data.sfx_order_id) ??
      asString(data.id) ??
      asString(data.awb_number) ??
      '';
    const trackingNumber =
      asString(data.awb_number) ??
      asString(data.tracking_id) ??
      asString(data.sfx_order_id) ??
      externalShipmentId;
    const providerStatus = asString(data.status) ?? 'new';
    const etaMins = asNumber(data.estimated_delivery_time) ?? asNumber(data.eta_minutes);

    return {
      externalShipmentId,
      trackingNumber,
      estimatedEtaMins: etaMins,
      estimatedArrivalAt: etaMins ? new Date(Date.now() + etaMins * 60_000) : undefined,
      deliveryCost: asNumber(data.delivery_charge) ?? asNumber(data.charge),
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
}
