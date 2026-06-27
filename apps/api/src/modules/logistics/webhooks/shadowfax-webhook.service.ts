import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  DeliveryProviderType,
  ProviderWebhookStatus,
  ShipmentProviderStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { DeliveryOrchestratorService } from '../delivery-orchestrator.service';
import { mapShadowfaxStatus } from '../mappers/shadowfax-status.mapper';
import { maskSensitivePayload } from '../utils/mask-sensitive.util';
import { LOGISTICS_EVENTS } from '../logistics.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ShadowfaxWebhookService {
  private readonly logger = new Logger(ShadowfaxWebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: DeliveryOrchestratorService,
    private readonly events: EventEmitter2,
    config: ConfigService,
  ) {
    this.webhookSecret = config.get<string>('SHADOWFAX_WEBHOOK_SECRET', '') ?? '';
  }

  verifySignature(rawBody: Buffer, signature: string | undefined): void {
    if (!this.webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Webhook secret not configured');
      }
      return;
    }
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException('Invalid webhook signature');
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

    const eventId =
      (typeof payload.event_id === 'string' && payload.event_id) ||
      (typeof payload.id === 'string' && payload.id) ||
      null;

    const provider = await this.prisma.deliveryProvider.upsert({
      where: { type: DeliveryProviderType.SHADOWFAX },
      create: { type: DeliveryProviderType.SHADOWFAX, name: 'Shadowfax', isActive: true, isPrimary: true },
      update: {},
    });

    if (eventId) {
      const dup = await this.prisma.providerWebhook.findUnique({
        where: {
          providerType_eventId: {
            providerType: DeliveryProviderType.SHADOWFAX,
            eventId,
          },
        },
      });
      if (dup) {
        this.logger.debug({ eventId }, 'Duplicate Shadowfax webhook ignored');
        return;
      }
    }

    const webhook = await this.prisma.providerWebhook.create({
      data: {
        providerId: provider.id,
        providerType: DeliveryProviderType.SHADOWFAX,
        eventId,
        payload: maskSensitivePayload(payload) as Prisma.InputJsonValue,
        signature,
        status: ProviderWebhookStatus.RECEIVED,
      },
    });

    this.logger.log(
      { webhookId: webhook.id, eventId, payload: maskSensitivePayload(payload) },
      'Shadowfax webhook received',
    );
    this.events.emit(LOGISTICS_EVENTS.WEBHOOK_RECEIVED, { webhookId: webhook.id, providerType: 'SHADOWFAX' });

    try {
      await this.processShadowfaxEvent(payload);
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

  private async processShadowfaxEvent(payload: Record<string, unknown>): Promise<void> {
    const data = (payload.data && typeof payload.data === 'object'
      ? payload.data
      : payload) as Record<string, unknown>;

    const externalId =
      (typeof data.shipment_id === 'string' && data.shipment_id) ||
      (typeof data.awb_number === 'string' && data.awb_number) ||
      (typeof data.client_order_id === 'string' && data.client_order_id) ||
      null;

    if (!externalId) {
      throw new BadRequestException('Webhook missing shipment identifier');
    }

    const shipment = await this.prisma.providerShipment.findFirst({
      where: {
        OR: [
          { externalShipmentId: externalId },
          { trackingNumber: externalId },
          { order: { orderNumber: externalId } },
        ],
      },
    });
    if (!shipment) {
      this.logger.warn({ externalId }, 'Shadowfax webhook for unknown shipment');
      return;
    }

    const providerStatus =
      (typeof data.status === 'string' && data.status) ||
      (typeof payload.event === 'string' && payload.event) ||
      'pending';
    const normalized = mapShadowfaxStatus(providerStatus);

    const rider =
      data.rider && typeof data.rider === 'object' ? (data.rider as Record<string, unknown>) : {};

    await this.orchestrator.applyStatusUpdate(shipment.id, providerStatus, normalized, {
      driverName:
        (typeof data.rider_name === 'string' && data.rider_name) ||
        (typeof rider.name === 'string' && rider.name) ||
        undefined,
      driverPhone:
        (typeof data.rider_phone === 'string' && data.rider_phone) ||
        (typeof rider.phone === 'string' && rider.phone) ||
        undefined,
      vehicleType:
        (typeof data.vehicle_type === 'string' && data.vehicle_type) ||
        (typeof rider.vehicle_type === 'string' && rider.vehicle_type) ||
        undefined,
      lat: typeof data.latitude === 'number' ? data.latitude : undefined,
      lng: typeof data.longitude === 'number' ? data.longitude : undefined,
      podUrl: typeof data.pod_url === 'string' ? data.pod_url : undefined,
      rawPayload: payload,
    });

    if (normalized === ShipmentProviderStatus.DELIVERED && typeof data.pod_url === 'string') {
      await this.prisma.providerShipment.update({
        where: { id: shipment.id },
        data: { podUrl: data.pod_url },
      });
    }
  }
}
