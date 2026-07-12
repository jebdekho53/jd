import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  DeliveryProviderType,
  Prisma,
  ProviderWebhookStatus,
  ShipmentProviderStatus,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { DeliveryOrchestratorService } from '../delivery-orchestrator.service';
import { mapBorzoStatus } from '../mappers/borzo-status.mapper';
import { maskSensitivePayload } from '../utils/mask-sensitive.util';
import { LOGISTICS_EVENTS } from '../logistics.constants';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Borzo order/delivery callbacks. Both are POSTed to the same Callback URL and
 * carry an `X-DV-Signature` header = HMAC-SHA256(rawBody, BORZO_CALLBACK_TOKEN).
 *
 * `order_created` / `order_changed` carry an `order` object; `delivery_created`
 * / `delivery_changed` carry a `delivery` object with the more granular status.
 */
@Injectable()
export class BorzoWebhookService {
  private readonly logger = new Logger(BorzoWebhookService.name);
  private readonly callbackToken: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: DeliveryOrchestratorService,
    private readonly events: EventEmitter2,
    config: ConfigService,
  ) {
    this.callbackToken = config.get<string>('BORZO_CALLBACK_TOKEN', '') ?? '';
  }

  verifySignature(rawBody: Buffer, signature: string | undefined): void {
    if (!this.callbackToken) {
      if (process.env.ALLOW_INSECURE_WEBHOOKS === 'true' && process.env.NODE_ENV !== 'production') {
        return;
      }
      throw new UnauthorizedException('Borzo callback token not configured');
    }
    if (!signature) throw new UnauthorizedException('Missing X-DV-Signature');

    const expected = createHmac('sha256', this.callbackToken).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException('Invalid X-DV-Signature');
    }
  }

  async handlePayload(rawBody: Buffer, signature?: string): Promise<void> {
    this.verifySignature(rawBody, signature);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Invalid JSON payload');
    }

    const order = asRecord(payload.order);
    const delivery = asRecord(payload.delivery);
    // Dedup key: order/delivery id + event time, since Borzo sends no event id.
    const entityId =
      asNumber(order.order_id) ?? asNumber(delivery.delivery_id) ?? asNumber(delivery.order_id);
    const eventId = entityId
      ? `${asString(payload.event_type) ?? 'event'}:${entityId}:${asString(payload.event_datetime) ?? ''}`
      : null;

    const provider = await this.prisma.deliveryProvider.upsert({
      where: { type: DeliveryProviderType.BORZO },
      create: { type: DeliveryProviderType.BORZO, name: 'Borzo', isActive: true, isPrimary: false },
      update: {},
    });

    if (eventId) {
      const dup = await this.prisma.providerWebhook.findUnique({
        where: { providerType_eventId: { providerType: DeliveryProviderType.BORZO, eventId } },
      });
      if (dup) {
        this.logger.debug({ eventId }, 'Duplicate Borzo webhook ignored');
        return;
      }
    }

    const webhook = await this.prisma.providerWebhook.create({
      data: {
        providerId: provider.id,
        providerType: DeliveryProviderType.BORZO,
        eventId,
        payload: maskSensitivePayload(payload) as Prisma.InputJsonValue,
        signature,
        status: ProviderWebhookStatus.RECEIVED,
      },
    });

    this.logger.log(
      { webhookId: webhook.id, eventId, eventType: payload.event_type },
      'Borzo webhook received',
    );
    this.events.emit(LOGISTICS_EVENTS.WEBHOOK_RECEIVED, {
      webhookId: webhook.id,
      providerType: 'BORZO',
    });

    try {
      await this.processEvent(order, delivery);
      await this.prisma.providerWebhook.update({
        where: { id: webhook.id },
        data: { status: ProviderWebhookStatus.PROCESSED, processedAt: new Date() },
      });
    } catch (err) {
      await this.prisma.providerWebhook.update({
        where: { id: webhook.id },
        data: {
          status: ProviderWebhookStatus.FAILED,
          errorMessage: err instanceof Error ? err.message : 'Processing failed',
          processedAt: new Date(),
        },
      });
      throw err;
    }
  }

  private async processEvent(
    order: Record<string, unknown>,
    delivery: Record<string, unknown>,
  ): Promise<void> {
    // Our external id is Borzo's order_id (see BorzoProvider.createShipment).
    const orderId = asNumber(order.order_id) ?? asNumber(delivery.order_id);
    const orderName = asString(order.order_name) ?? asString(delivery.order_name);
    const clientOrderId = asString(delivery.client_order_id);
    const externalId = orderId ? String(orderId) : null;

    if (!externalId && !orderName && !clientOrderId) {
      throw new BadRequestException('Borzo webhook missing order identifier');
    }

    const shipment = await this.prisma.providerShipment.findFirst({
      where: {
        providerType: DeliveryProviderType.BORZO,
        OR: [
          ...(externalId ? [{ externalShipmentId: externalId }] : []),
          ...(orderName ? [{ trackingNumber: orderName }] : []),
          ...(clientOrderId ? [{ order: { orderNumber: clientOrderId } }] : []),
        ],
      },
    });
    if (!shipment) {
      this.logger.warn({ externalId, orderName, clientOrderId }, 'Borzo webhook for unknown shipment');
      return;
    }

    // Prefer the granular delivery status; the last order point carries one too.
    const points = Array.isArray(order.points) ? order.points : [];
    const lastPoint = asRecord(points[points.length - 1]);
    const providerStatus =
      asString(delivery.status) ??
      asString(asRecord(lastPoint.delivery).status) ??
      asString(order.status) ??
      'planned';
    const normalized = mapBorzoStatus(providerStatus);

    const courier = asRecord(order.courier ?? delivery.courier);
    const podUrl = asString(lastPoint.sign_photo_url) ?? asString(lastPoint.place_photo_url);

    await this.orchestrator.applyStatusUpdate(shipment.id, providerStatus, normalized, {
      driverName: [courier.name, courier.surname].map((p) => asString(p)).filter(Boolean).join(' ') || undefined,
      driverPhone: asString(courier.phone),
      lat: asNumber(courier.latitude),
      lng: asNumber(courier.longitude),
      podUrl,
      rawPayload: { order, delivery },
    });

    if (normalized === ShipmentProviderStatus.DELIVERED && podUrl) {
      await this.prisma.providerShipment.update({
        where: { id: shipment.id },
        data: { podUrl },
      });
    }
  }
}
