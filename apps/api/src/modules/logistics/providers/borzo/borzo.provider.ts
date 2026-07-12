import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryProviderType, ShipmentProviderStatus } from '@prisma/client';
import type {
  CreateShipmentInput,
  ILogisticsProvider,
  PriceEstimateInput,
  PriceEstimateResult,
  ProofOfDeliveryResult,
  ProviderHealthResult,
  ShipmentAddress,
  ShipmentResult,
  TrackShipmentResult,
} from '../../interfaces/logistics-provider.interface';
import { getConfig } from '../../../../config/configuration';
import { LogisticsProviderError } from '../../errors/logistics.errors';
import { mapBorzoStatus } from '../../mappers/borzo-status.mapper';
import { BorzoClient, type BorzoCreatePayload, type BorzoPoint, type BorzoResponse } from './borzo.client';

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

/** Borzo expects country-code + number, digits only (e.g. 918880000001). */
function toBorzoPhone(phone: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

function money(value: number | null | undefined): string {
  return Math.max(0, Number(value ?? 0)).toFixed(2);
}

@Injectable()
export class BorzoProvider implements ILogisticsProvider {
  readonly type = DeliveryProviderType.BORZO;
  private readonly logger = new Logger(BorzoProvider.name);
  private readonly cfg: ReturnType<typeof getConfig>['logistics']['borzo'];

  constructor(
    private readonly client: BorzoClient,
    configService: ConfigService,
  ) {
    this.cfg = getConfig(configService).logistics.borzo;
  }

  async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const payload = this.toCreatePayload(input);
    this.logger.log(
      { orderId: input.orderId, points: payload.points.length, matter: payload.matter },
      'Borzo create-order payload prepared',
    );

    const raw = await this.client.createOrder(payload);
    const order = asRecord(raw.order);
    const orderId = asNumber(order.order_id);
    if (!orderId) {
      throw new LogisticsProviderError(
        'Borzo create-order response had no order_id',
        DeliveryProviderType.BORZO,
        'MISSING_SHIPMENT_IDENTIFIER',
        false,
        undefined,
        { providerMessage: 'Missing order.order_id in Borzo response' },
      );
    }

    const externalShipmentId = String(orderId);
    const trackingNumber = asString(order.order_name) ?? externalShipmentId;
    const providerStatus = asString(order.status) ?? 'new';
    const courier = asRecord(order.courier);
    const dropPoint = this.dropPoint(order);

    return {
      externalShipmentId,
      trackingNumber,
      deliveryCost: asNumber(order.payment_amount) ?? asNumber(order.delivery_fee_amount),
      providerStatus,
      normalizedStatus: mapBorzoStatus(providerStatus),
      driverName: this.courierName(courier),
      driverPhone: asString(courier.phone),
      labelUrl: asString(dropPoint.tracking_url),
      rawResponse: raw,
    };
  }

  async cancelShipment(externalShipmentId: string): Promise<void> {
    await this.client.cancelOrder(externalShipmentId);
  }

  async trackShipment(externalShipmentId: string): Promise<TrackShipmentResult> {
    const raw = await this.client.getOrder(externalShipmentId);
    const orders = Array.isArray(raw.orders) ? raw.orders : [];
    const order = asRecord(orders[0] ?? raw.order);
    const dropPoint = this.dropPoint(order);
    const delivery = asRecord(dropPoint.delivery);
    const courier = asRecord(order.courier);

    // The delivery status is granular (parcel_picked_up etc.); fall back to the
    // coarser order status when a point has no delivery attached yet.
    const providerStatus =
      asString(delivery.status) ?? asString(order.status) ?? 'planned';

    return {
      externalShipmentId,
      trackingNumber: asString(order.order_name) ?? externalShipmentId,
      providerStatus,
      normalizedStatus: mapBorzoStatus(providerStatus),
      driverName: this.courierName(courier),
      driverPhone: asString(courier.phone),
      lat: asNumber(courier.latitude),
      lng: asNumber(courier.longitude),
      rawResponse: raw,
    };
  }

  async estimatePrice(input: PriceEstimateInput): Promise<PriceEstimateResult> {
    const raw = await this.client.calculateOrder(this.toEstimatePayload(input));
    const order = asRecord(raw.order);
    return {
      amount: asNumber(order.payment_amount) ?? asNumber(order.delivery_fee_amount) ?? 0,
      currency: 'INR',
    };
  }

  async estimateETA(input: PriceEstimateInput): Promise<{ estimatedMins: number }> {
    // Borzo's calculate-order does not return an ETA; use a sensible hyperlocal default.
    await this.estimatePrice(input).catch(() => undefined);
    return { estimatedMins: 45 };
  }

  async getProofOfDelivery(externalShipmentId: string): Promise<ProofOfDeliveryResult> {
    const track = await this.trackShipment(externalShipmentId);
    const order = asRecord(asRecord(track.rawResponse).order);
    const dropPoint = this.dropPoint(order);
    return {
      podUrl: asString(dropPoint.sign_photo_url) ?? asString(dropPoint.place_photo_url),
      deliveredAt:
        track.normalizedStatus === ShipmentProviderStatus.DELIVERED ? new Date() : undefined,
      signatureUrl: asString(dropPoint.sign_photo_url),
    };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    const result = await this.client.healthCheck();
    return { healthy: result.healthy, latencyMs: result.latencyMs, message: result.message };
  }

  // ── payload builders ───────────────────────────────────────────────────────

  private toPoint(addr: ShipmentAddress, extra: Partial<BorzoPoint> = {}): BorzoPoint {
    const line = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(', ');
    return {
      address: line,
      contact_person: { phone: toBorzoPhone(addr.phone), name: addr.name || undefined },
      latitude: Number.isFinite(addr.lat) ? String(addr.lat) : undefined,
      longitude: Number.isFinite(addr.lng) ? String(addr.lng) : undefined,
      ...extra,
    };
  }

  private toCreatePayload(input: CreateShipmentInput): BorzoCreatePayload {
    const codAmount = Math.max(0, input.amounts?.codAmount ?? input.codAmount ?? 0);
    const dropExtra: Partial<BorzoPoint> = {
      client_order_id: input.orderNumber,
      note: input.notes,
    };
    if (codAmount > 0) {
      dropExtra.taking_amount = money(codAmount);
      dropExtra.is_cod_cash_voucher_required = true;
    }

    return {
      matter: this.resolveMatter(input),
      vehicle_type_id: this.cfg.vehicleTypeId,
      is_contact_person_notification_enabled: true,
      points: [this.toPoint(input.pickup), this.toPoint(input.dropoff, dropExtra)],
    };
  }

  private toEstimatePayload(input: PriceEstimateInput): BorzoCreatePayload {
    // calculate-order tolerates missing contact data, so a bare lat/lng pair works.
    const point = (lat: number, lng: number): BorzoPoint => ({
      address: `${lat}, ${lng}`,
      contact_person: { phone: '' },
      latitude: String(lat),
      longitude: String(lng),
    });
    return {
      matter: this.cfg.defaultMatter,
      vehicle_type_id: this.cfg.vehicleTypeId,
      points: [
        point(input.pickupLat, input.pickupLng),
        point(input.dropoffLat, input.dropoffLng),
      ],
    };
  }

  private resolveMatter(input: CreateShipmentInput): string {
    const names = (input.items ?? [])
      .map((item) => item.name?.trim())
      .filter((name): name is string => Boolean(name));
    const label = names.slice(0, 3).join(', ');
    return (label || this.cfg.defaultMatter).slice(0, 5000);
  }

  private dropPoint(order: Record<string, unknown>): Record<string, unknown> {
    const points = Array.isArray(order.points) ? order.points : [];
    // The pickup is always the first point; the customer drop is the last.
    return asRecord(points[points.length - 1]);
  }

  private courierName(courier: Record<string, unknown>): string | undefined {
    const parts = [courier.name, courier.middlename, courier.surname]
      .map((part) => asString(part))
      .filter(Boolean);
    return parts.length ? parts.join(' ') : undefined;
  }
}
