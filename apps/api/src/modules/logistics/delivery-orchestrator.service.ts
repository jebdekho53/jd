import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DeliveryProviderType,
  DeliveryStatus,
  DomainEventType,
  OrderActorType,
  OrderStatus,
  Prisma,
  ShipmentProviderStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { safeDistanceKm } from '../../common/utils/delivery-eta.util';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { OrderCacheService } from '../order/order-cache.service';
import type { CreateShipmentInput } from './interfaces/logistics-provider.interface';
import { LogisticsProviderRegistry } from './logistics-provider.registry';
import { LOGISTICS_EVENTS, LOGISTICS_RETRY_MAX } from './logistics.constants';
import { LogisticsProviderError } from './errors/logistics.errors';
import { mapShadowfaxStatus, normalizedToDeliveryStatus } from './mappers/shadowfax-status.mapper';
import { maskSensitivePayload } from './utils/mask-sensitive.util';
import { isDispatchPaymentCleared } from '../order/merchant-order-visibility.util';
import { OrderDeliveredHandlerService } from '../order/order-delivered-handler.service';
import { isDispatchEligibleOrderStatus } from './utils/dispatch-eligibility.util';
import { parseShadowfaxAwbPool } from './providers/shadowfax/shadowfax-awb-pool.util';
import { EmailNotificationService } from '../email/email-notification.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';

const PROVIDER_NAMES: Record<DeliveryProviderType, string> = {
  [DeliveryProviderType.SHADOWFAX]: 'Shadowfax',
  [DeliveryProviderType.PORTER]: 'Porter',
  [DeliveryProviderType.DELHIVERY]: 'Delhivery',
  [DeliveryProviderType.BORZO]: 'Borzo',
  [DeliveryProviderType.OWN_FLEET]: 'JebDekho Riders',
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asMoney(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function positiveMoney(value: number, fallback = 1): number {
  return Number(Math.max(fallback, value).toFixed(2));
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

function extractShipmentIdentifier(rawResponse: unknown): {
  externalShipmentId?: string;
  trackingNumber?: string;
  providerStatus?: string;
} {
  const awbNumber = findStringByKeys(rawResponse, ['awb_number', 'awbNumber', 'awb', 'AWB']);
  const shadowfaxOrderId = findStringByKeys(rawResponse, ['sfx_order_id', 'sfxOrderId', 'shadowfax_order_id']);
  const shipmentId = findStringByKeys(rawResponse, ['shipment_id', 'shipmentId', 'id']);
  const trackingId = findStringByKeys(rawResponse, ['tracking_id', 'trackingId', 'tracking_number', 'trackingNumber']);
  const externalShipmentId = awbNumber ?? shadowfaxOrderId ?? shipmentId ?? trackingId;
  return {
    externalShipmentId,
    trackingNumber: awbNumber ?? trackingId ?? shadowfaxOrderId ?? externalShipmentId,
    providerStatus: findStringByKeys(rawResponse, ['status_id', 'status']),
  };
}

@Injectable()
export class DeliveryOrchestratorService {
  private readonly logger = new Logger(DeliveryOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: LogisticsProviderRegistry,
    private readonly domainEvents: DomainEventsService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly orderCache: OrderCacheService,
    private readonly events: EventEmitter2,
    private readonly orderDelivered: OrderDeliveredHandlerService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly buyerPush: BuyerPushNotificationService,
    private readonly config: ConfigService,
  ) {}

  async dispatchShipment(orderId: string, attempt = 1, options?: { allowAssignedRepair?: boolean }): Promise<{
    shipmentId: string;
    deliveryId: string;
    trackingNumber: string;
    estimatedEtaMins: number | null;
  }> {
    const existing = await this.prisma.providerShipment.findUnique({
      where: { orderId },
      select: { id: true, externalShipmentId: true, trackingNumber: true, deliveryId: true, estimatedEtaMins: true },
    });
    if (existing?.externalShipmentId?.trim()) {
      return {
        shipmentId: existing.id,
        deliveryId: existing.deliveryId!,
        trackingNumber: existing.trackingNumber ?? existing.externalShipmentId,
        estimatedEtaMins: existing.estimatedEtaMins,
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, paymentMethod: true, paymentStatus: true, orderVertical: true, deliveryMode: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    // Enforced here (not just at the primary dispatch call site) because this
    // method has multiple entry points — claim replacements and the merchant
    // "retry shipment" action both call it directly, and both were able to
    // create a real 3PL shipment for a store that delivers its own orders.
    if (order.deliveryMode === 'SELF') {
      throw new BadRequestException('This store delivers its own orders — no 3PL shipment can be created');
    }
    const allowAssignedRepair =
      options?.allowAssignedRepair === true && order.status === OrderStatus.RIDER_ASSIGNED;
    if (!allowAssignedRepair && !isDispatchEligibleOrderStatus(order.status, order.orderVertical)) {
      throw new BadRequestException(
        `Cannot dispatch shipment: order status ${order.status} is not eligible for dispatch`,
      );
    }
    if (!isDispatchPaymentCleared(order.paymentMethod, order.paymentStatus)) {
      throw new BadRequestException('Cannot dispatch shipment: payment not confirmed');
    }

    const providerType = this.registry.primaryType;
    if (providerType === DeliveryProviderType.OWN_FLEET) {
      throw new BadRequestException('Own fleet dispatch must use RiderAssignmentService');
    }

    const providerRecord = await this.ensureProviderRecord(providerType);
    const provider = this.registry.get(providerType);
    const input = await this.buildShipmentInput(orderId);

    try {
      const result = await provider.createShipment(input);
      const deliveryStatus = normalizedToDeliveryStatus(result.normalizedStatus);

      const delivery = await this.prisma.delivery.upsert({
        where: { orderId },
        create: {
          orderId,
          status: deliveryStatus === DeliveryStatus.PENDING ? DeliveryStatus.ASSIGNED : deliveryStatus,
          pickupLat: input.pickup.lat,
          pickupLng: input.pickup.lng,
          deliveryLat: input.dropoff.lat,
          deliveryLng: input.dropoff.lng,
          distanceKm: safeDistanceKm(input.pickup.lat, input.pickup.lng, input.dropoff.lat, input.dropoff.lng),
          estimatedMins: result.estimatedEtaMins ?? null,
          estimatedArrivalAt: result.estimatedArrivalAt ?? null,
          assignedAt: new Date(),
          assignedBy: 'logistics-orchestrator',
        },
        update: {
          status: deliveryStatus === DeliveryStatus.PENDING ? DeliveryStatus.ASSIGNED : deliveryStatus,
          estimatedMins: result.estimatedEtaMins ?? null,
          estimatedArrivalAt: result.estimatedArrivalAt ?? null,
        },
      });

      const shipment = await this.prisma.providerShipment.upsert({
        where: { orderId },
        create: {
          orderId,
          deliveryId: delivery.id,
          providerId: providerRecord.id,
          providerType,
          externalShipmentId: result.externalShipmentId,
          trackingNumber: result.trackingNumber,
          normalizedStatus: result.normalizedStatus,
          providerStatus: result.providerStatus,
          estimatedEtaMins: result.estimatedEtaMins,
          estimatedArrivalAt: result.estimatedArrivalAt,
          deliveryCost: result.deliveryCost != null ? new Prisma.Decimal(result.deliveryCost) : null,
          driverName: result.driverName,
          driverPhone: result.driverPhone,
          vehicleType: result.vehicleType,
          labelUrl: result.labelUrl,
          rawResponse: maskSensitivePayload(result.rawResponse ?? {}) as Prisma.InputJsonValue,
        },
        update: {
          deliveryId: delivery.id,
          providerId: providerRecord.id,
          providerType,
          externalShipmentId: result.externalShipmentId,
          trackingNumber: result.trackingNumber,
          normalizedStatus: result.normalizedStatus,
          providerStatus: result.providerStatus,
          estimatedEtaMins: result.estimatedEtaMins,
          estimatedArrivalAt: result.estimatedArrivalAt,
          deliveryCost: result.deliveryCost != null ? new Prisma.Decimal(result.deliveryCost) : null,
          driverName: result.driverName,
          driverPhone: result.driverPhone,
          vehicleType: result.vehicleType,
          labelUrl: result.labelUrl,
          rawResponse: maskSensitivePayload(result.rawResponse ?? {}) as Prisma.InputJsonValue,
          lastError: null,
          retryCount: 0,
        },
      });

      await this.prisma.providerTrackingEvent.create({
        data: {
          shipmentId: shipment.id,
          providerStatus: result.providerStatus,
          normalizedStatus: result.normalizedStatus,
          description: 'Shipment created',
          rawPayload: maskSensitivePayload(result.rawResponse ?? {}) as Prisma.InputJsonValue,
        },
      });

      await this.statusHistory.transition({
        orderId,
        toStatus: OrderStatus.RIDER_ASSIGNED,
        actorType: OrderActorType.SYSTEM,
        actorId: 'logistics-orchestrator',
        note: `Shipment created via ${PROVIDER_NAMES[providerType]}`,
        skipIfAlreadyStatus: true,
      });

      void this.domainEvents.emit(
        DomainEventType.RIDER_ASSIGNED,
        'provider_shipment',
        shipment.id,
        {
          orderId,
          providerType,
          trackingNumber: result.trackingNumber,
        } as Prisma.InputJsonValue,
      );
      this.events.emit(LOGISTICS_EVENTS.SHIPMENT_CREATED, { orderId, shipmentId: shipment.id, providerType });
      void this.emailNotifications.sendBuyerDeliveryAssigned(orderId).catch(() => {});
      // Own-fleet assignment sends both email and push (rider-assignment.service.ts)
      // — the 3PL path only ever sent the email, so buyers dispatched via
      // Shadowfax/Borzo got no push notification when a rider was assigned.
      void this.buyerPush.notifyRiderAssigned(orderId).catch(() => {});

      void this.orderCache.invalidateAll(orderId);

      return {
        shipmentId: shipment.id,
        deliveryId: delivery.id,
        trackingNumber: result.trackingNumber,
        estimatedEtaMins: result.estimatedEtaMins ?? null,
      };
    } catch (err) {
      const retryable = err instanceof LogisticsProviderError && err.retryable;
      this.logger.error({ orderId, providerType, attempt, err }, 'Shipment creation failed');
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { orderNumber: true },
      }).catch(() => null);
      if (order?.orderNumber) {
        void this.emailNotifications.sendAdminDeliveryFailedOrDelayed(order.orderNumber).catch(() => {});
      }

      await this.prisma.providerShipment.upsert({
        where: { orderId },
        create: {
          orderId,
          providerId: providerRecord.id,
          providerType,
          normalizedStatus: ShipmentProviderStatus.FAILED,
          retryCount: attempt,
          lastError: err instanceof Error ? err.message : 'Unknown error',
        },
        update: {
          retryCount: attempt,
          lastError: err instanceof Error ? err.message : 'Unknown error',
          normalizedStatus: ShipmentProviderStatus.FAILED,
        },
      });

      this.events.emit(LOGISTICS_EVENTS.SHIPMENT_FAILED, { orderId, providerType, attempt, err });

      if (retryable && attempt < LOGISTICS_RETRY_MAX) {
        return this.dispatchShipment(orderId, attempt + 1, options);
      }
      throw err;
    }
  }

  async retryShipment(orderId: string): Promise<{
    shipmentId: string;
    deliveryId: string;
    trackingNumber: string;
    estimatedEtaMins: number | null;
  }> {
    const shipment = await this.prisma.providerShipment.findUnique({ where: { orderId } });
    if (shipment?.externalShipmentId?.trim()) {
      throw new BadRequestException('Shipment already exists — cancel before retrying');
    }
    const repaired = await this.repairShipmentIdentifierFromRawResponse(shipment);
    if (repaired) return repaired;
    if (shipment) {
      await this.prisma.providerShipment.delete({ where: { id: shipment.id } });
    }
    return this.dispatchShipment(orderId, 1, { allowAssignedRepair: true });
  }

  private async repairShipmentIdentifierFromRawResponse(shipment: {
    id: string;
    deliveryId: string | null;
    providerType: DeliveryProviderType;
    rawResponse: Prisma.JsonValue | null;
    estimatedEtaMins: number | null;
  } | null): Promise<{
    shipmentId: string;
    deliveryId: string;
    trackingNumber: string;
    estimatedEtaMins: number | null;
  } | null> {
    if (!shipment?.rawResponse || shipment.providerType !== DeliveryProviderType.SHADOWFAX) return null;

    const extracted = extractShipmentIdentifier(shipment.rawResponse);
    if (!extracted.externalShipmentId || !shipment.deliveryId) return null;

    const raw = asRecord(shipment.rawResponse);
    const providerStatus = extracted.providerStatus ?? asString(raw.status) ?? 'new';
    const normalizedStatus = mapShadowfaxStatus(providerStatus);
    const updated = await this.prisma.providerShipment.update({
      where: { id: shipment.id },
      data: {
        externalShipmentId: extracted.externalShipmentId,
        trackingNumber: extracted.trackingNumber ?? extracted.externalShipmentId,
        providerStatus,
        normalizedStatus,
        lastError: null,
      },
      select: {
        id: true,
        deliveryId: true,
        trackingNumber: true,
        externalShipmentId: true,
        estimatedEtaMins: true,
      },
    });

    this.logger.warn(
      {
        shipmentId: shipment.id,
        externalShipmentId: updated.externalShipmentId,
      },
      'Repaired missing provider shipment identifier from raw Shadowfax response',
    );

    return {
      shipmentId: updated.id,
      deliveryId: updated.deliveryId!,
      trackingNumber: updated.trackingNumber ?? updated.externalShipmentId!,
      estimatedEtaMins: updated.estimatedEtaMins,
    };
  }

  async cancelShipment(orderId: string, reason?: string): Promise<void> {
    const shipment = await this.prisma.providerShipment.findUnique({ where: { orderId } });
    if (!shipment?.externalShipmentId) {
      throw new NotFoundException('No active provider shipment for this order');
    }

    const provider = this.registry.get(shipment.providerType);
    await provider.cancelShipment(shipment.externalShipmentId, reason);

    await this.prisma.$transaction([
      this.prisma.providerShipment.update({
        where: { id: shipment.id },
        data: {
          normalizedStatus: ShipmentProviderStatus.CANCELLED,
          providerStatus: 'cancelled',
          cancelledAt: new Date(),
        },
      }),
      ...(shipment.deliveryId
        ? [
            this.prisma.delivery.update({
              where: { id: shipment.deliveryId },
              data: { status: DeliveryStatus.CANCELLED },
            }),
          ]
        : []),
    ]);
  }

  async syncShipmentTracking(orderId: string): Promise<void> {
    const shipment = await this.prisma.providerShipment.findUnique({
      where: { orderId },
      include: { delivery: true },
    });
    if (!shipment?.externalShipmentId) return;

    const provider = this.registry.get(shipment.providerType);
    const track = await provider.trackShipment(shipment.externalShipmentId);
    await this.applyStatusUpdate(shipment.id, track.providerStatus, track.normalizedStatus, {
      driverName: track.driverName,
      driverPhone: track.driverPhone,
      vehicleType: track.vehicleType,
      estimatedEtaMins: track.estimatedEtaMins,
      estimatedArrivalAt: track.estimatedArrivalAt,
      lat: track.lat,
      lng: track.lng,
      rawPayload: track.rawResponse,
    });
  }

  async applyStatusUpdate(
    shipmentId: string,
    providerStatus: string,
    normalizedStatus: ShipmentProviderStatus,
    extras?: {
      driverName?: string;
      driverPhone?: string;
      vehicleType?: string;
      estimatedEtaMins?: number;
      estimatedArrivalAt?: Date;
      lat?: number;
      lng?: number;
      rawPayload?: unknown;
      podUrl?: string;
    },
  ): Promise<void> {
    const shipment = await this.prisma.providerShipment.findUnique({
      where: { id: shipmentId },
      include: { delivery: true, order: { select: { id: true, status: true } } },
    });
    if (!shipment) return;

    if (shipment.normalizedStatus === normalizedStatus && !extras?.driverName) return;

    const deliveryStatus = normalizedToDeliveryStatus(normalizedStatus);

    await this.prisma.$transaction([
      this.prisma.providerShipment.update({
        where: { id: shipmentId },
        data: {
          providerStatus,
          normalizedStatus,
          driverName: extras?.driverName ?? undefined,
          driverPhone: extras?.driverPhone ?? undefined,
          vehicleType: extras?.vehicleType ?? undefined,
          estimatedEtaMins: extras?.estimatedEtaMins ?? undefined,
          estimatedArrivalAt: extras?.estimatedArrivalAt ?? undefined,
          podUrl: extras?.podUrl ?? undefined,
          deliveredAt:
            normalizedStatus === ShipmentProviderStatus.DELIVERED ? new Date() : undefined,
        },
      }),
      ...(shipment.deliveryId
        ? [
            this.prisma.delivery.update({
              where: { id: shipment.deliveryId },
              data: {
                status: deliveryStatus,
                estimatedMins: extras?.estimatedEtaMins ?? undefined,
                estimatedArrivalAt: extras?.estimatedArrivalAt ?? undefined,
                pickedUpAt:
                  normalizedStatus === ShipmentProviderStatus.PICKED_UP ? new Date() : undefined,
                deliveredAt:
                  normalizedStatus === ShipmentProviderStatus.DELIVERED ? new Date() : undefined,
                deliveryProofUrl: extras?.podUrl ?? undefined,
              },
            }),
          ]
        : []),
      this.prisma.providerTrackingEvent.create({
        data: {
          shipmentId,
          providerStatus,
          normalizedStatus,
          description: providerStatus,
          lat: extras?.lat,
          lng: extras?.lng,
          rawPayload: maskSensitivePayload(extras?.rawPayload ?? {}) as Prisma.InputJsonValue,
        },
      }),
    ]);

    await this.syncOrderStatus(shipment.orderId, normalizedStatus);
    void this.orderCache.invalidateAll(shipment.orderId);
    this.events.emit(LOGISTICS_EVENTS.SHIPMENT_STATUS_UPDATED, {
      orderId: shipment.orderId,
      shipmentId,
      normalizedStatus,
    });

    if (normalizedStatus === ShipmentProviderStatus.DELIVERED) {
      void this.orderDelivered.handleProviderDelivered(
        shipment.orderId,
        shipment.providerType,
        shipment.deliveryId,
      ).catch((err) => {
        this.logger.error({ err, orderId: shipment.orderId }, 'Provider delivered handler failed');
      });
    }
  }

  private async syncOrderStatus(orderId: string, status: ShipmentProviderStatus): Promise<void> {
    const target = this.orderStatusForShipment(status);
    if (!target) return;
    await this.statusHistory.transition({
      orderId,
      toStatus: target,
      actorType: OrderActorType.SYSTEM,
      actorId: 'logistics-orchestrator',
      note: `Provider status: ${status}`,
      skipIfAlreadyStatus: true,
    });
    // The own-fleet rider path and the self-delivery merchant path both notify
    // the buyer here (order.service.ts, rider/delivery.service.ts) — this 3PL
    // path (the default when own-fleet is off) never did, for either vertical.
    if (target === OrderStatus.OUT_FOR_DELIVERY) {
      void this.emailNotifications.sendBuyerPickedUpOrOutForDelivery(orderId).catch(() => {});
      void this.buyerPush.notifyOutForDelivery(orderId).catch(() => {});
    }
  }

  private orderStatusForShipment(status: ShipmentProviderStatus): OrderStatus | null {
    switch (status) {
      case ShipmentProviderStatus.ASSIGNED:
      case ShipmentProviderStatus.PICKUP_STARTED:
        return OrderStatus.RIDER_ASSIGNED;
      case ShipmentProviderStatus.PICKED_UP:
        return OrderStatus.PICKED_UP;
      case ShipmentProviderStatus.IN_TRANSIT:
      case ShipmentProviderStatus.NEARBY:
        return OrderStatus.OUT_FOR_DELIVERY;
      case ShipmentProviderStatus.DELIVERED:
        return OrderStatus.DELIVERED;
      case ShipmentProviderStatus.FAILED:
        return OrderStatus.DELIVERY_FAILED;
      case ShipmentProviderStatus.CANCELLED:
        return OrderStatus.CANCELLED_BY_MERCHANT;
      default:
        return null;
    }
  }

  private async ensureProviderRecord(type: DeliveryProviderType) {
    return this.prisma.deliveryProvider.upsert({
      where: { type },
      create: {
        type,
        name: PROVIDER_NAMES[type],
        isActive: true,
        isPrimary: type === this.registry.primaryType,
      },
      update: {
        isPrimary: type === this.registry.primaryType,
      },
    });
  }

  private async buildShipmentInput(orderId: string): Promise<CreateShipmentInput> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: {
            name: true,
            phone: true,
            line1: true,
            line2: true,
            pincode: true,
            latitude: true,
            longitude: true,
            city: { select: { name: true } },
          },
        },
        items: {
          include: {
            product: {
              select: {
                weightGrams: true,
                hsnCodeRef: { select: { code: true } },
              },
            },
            variant: {
              select: {
                sku: true,
                weightGrams: true,
              },
            },
          },
        },
        foodItems: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const addr = order.deliveryAddress as Record<string, string>;
    const payerContact = await this.resolvePayerContact(orderId);
    const codAmount =
      order.paymentMethod === 'COD' ? Number(order.totalAmount) : undefined;
    const groceryItems = order.items.map((item) => {
      const unitPrice = asMoney(item.unitPrice);
      const totalPrice = positiveMoney(asMoney(item.totalPrice) || unitPrice * item.quantity);
      return {
        name: [item.productName, item.variantName].filter(Boolean).join(' ').trim() || 'JebDekho item',
        sku: item.sku || item.variant.sku || undefined,
        hsnCode: item.product.hsnCodeRef?.code,
        quantity: Math.max(1, item.quantity),
        unitPrice: positiveMoney(unitPrice),
        totalPrice,
        tax: asMoney(item.tax),
        discount: asMoney(item.discount),
        weightGrams: item.variant.weightGrams ?? item.product.weightGrams ?? undefined,
      };
    });
    const foodItems = order.foodItems.map((item) => {
      const unitPrice = asMoney(item.unitPrice);
      const totalPrice = positiveMoney(asMoney(item.totalPrice) || unitPrice * item.quantity);
      return {
        name: [item.itemName, item.variantName].filter(Boolean).join(' ').trim() || 'JebDekho food item',
        sku: `FOOD-${item.menuItemId}`,
        quantity: Math.max(1, item.quantity),
        unitPrice: positiveMoney(unitPrice),
        totalPrice,
        tax: asMoney(item.tax),
        discount: asMoney(item.discount),
        weightGrams: undefined,
      };
    });
    const shipmentItems = [...groceryItems, ...foodItems];
    const itemValue = shipmentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const subtotal = asMoney(order.subtotal);
    const totalAmount = positiveMoney(asMoney(order.totalAmount));
    const productValue = positiveMoney(totalAmount || itemValue || subtotal);
    const packageWeight = Math.max(
      500,
      shipmentItems.reduce(
        (sum, item) => sum + (item.weightGrams ?? 0) * item.quantity,
        0,
      ),
    );

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      awbNumber: await this.allocateShadowfaxAwb(order.id),
      pickup: {
        name: order.store.name,
        phone: order.store.phone ?? '0000000000',
        line1: order.store.line1,
        line2: order.store.line2 ?? undefined,
        city: order.store.city.name,
        pincode: order.store.pincode,
        lat: order.store.latitude,
        lng: order.store.longitude,
      },
      dropoff: {
        name: payerContact?.name ?? addr.name ?? addr.recipientName ?? 'Customer',
        phone: payerContact?.phone ?? addr.phone ?? addr.mobile ?? '0000000000',
        line1: addr.line1 ?? addr.addressLine1 ?? 'Address',
        line2: addr.line2 ?? addr.addressLine2 ?? undefined,
        city: addr.city ?? 'City',
        state: addr.state ?? undefined,
        pincode: addr.pincode ?? addr.postalCode ?? '000000',
        lat: order.deliveryLat,
        lng: order.deliveryLng,
      },
      codAmount,
      weightGrams: packageWeight,
      amounts: {
        subtotal,
        discountAmount: asMoney(order.discountAmount),
        deliveryFee: asMoney(order.deliveryFee),
        taxAmount: asMoney(order.taxAmount),
        totalAmount,
        payableAmount: totalAmount,
        productValue,
        declaredValue: productValue,
        invoiceValue: totalAmount,
        codAmount: order.paymentMethod === 'COD' ? totalAmount : 0,
      },
      package: {
        weightGrams: packageWeight,
        lengthCm: 10,
        breadthCm: 10,
        heightCm: 10,
      },
      items: shipmentItems.length > 0
        ? shipmentItems
        : [{
          name: 'JebDekho order',
          quantity: 1,
          unitPrice: productValue,
          totalPrice: productValue,
          weightGrams: packageWeight,
        }],
    };
  }

  private async allocateShadowfaxAwb(orderId: string): Promise<string | undefined> {
    if (this.registry.primaryType !== DeliveryProviderType.SHADOWFAX) return undefined;
    const awbs = this.shadowfaxPreallocatedAwbs();
    if (awbs.length === 0) return undefined;

    const existing = await this.prisma.providerShipment.findUnique({
      where: { orderId },
      select: { externalShipmentId: true, trackingNumber: true },
    });
    const existingAwb = awbs.find((awb) => awb === existing?.externalShipmentId || awb === existing?.trackingNumber);
    if (existingAwb) return existingAwb;

    const used = await this.prisma.providerShipment.findMany({
      where: {
        providerType: DeliveryProviderType.SHADOWFAX,
        OR: [
          { externalShipmentId: { in: awbs } },
          { trackingNumber: { in: awbs } },
        ],
      },
      select: { externalShipmentId: true, trackingNumber: true },
    });
    const usedAwbs = new Set(
      used.flatMap((row) => [row.externalShipmentId, row.trackingNumber]).filter((value): value is string => Boolean(value)),
    );
    const nextAwb = awbs.find((awb) => !usedAwbs.has(awb));
    if (!nextAwb) {
      throw new LogisticsProviderError(
        'No unused Shadowfax preallocated AWB numbers are available',
        DeliveryProviderType.SHADOWFAX,
        'SHADOWFAX_AWB_POOL_EXHAUSTED',
        false,
        undefined,
        { providerMessage: 'Shadowfax AWB pool exhausted' },
      );
    }
    return nextAwb;
  }

  private shadowfaxPreallocatedAwbs(): string[] {
    return parseShadowfaxAwbPool(this.config.get<string>('SHADOWFAX_PREALLOCATED_AWBS', ''));
  }

  private async resolvePayerContact(
    orderId: string,
  ): Promise<{ name: string; phone: string } | null> {
    const checkout = await this.prisma.checkout.findFirst({
      where: { orderId },
      select: { cartSnapshot: true },
    });
    if (!checkout?.cartSnapshot) return null;

    try {
      const snap =
        typeof checkout.cartSnapshot === 'string'
          ? (JSON.parse(checkout.cartSnapshot) as Record<string, unknown>)
          : (checkout.cartSnapshot as Record<string, unknown>);
      const raw = snap.payerContact as { name?: string; phone?: string } | undefined;
      if (raw?.name?.trim() && raw?.phone?.trim()) {
        return { name: raw.name.trim(), phone: raw.phone.replace(/\D/g, '').slice(-10) };
      }
    } catch {
      return null;
    }
    return null;
  }

  async getDashboardStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayCount, delivered, failed, avgCost, avgEta, webhookFailures, unhealthy] =
      await Promise.all([
        this.prisma.providerShipment.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.providerShipment.count({
          where: { createdAt: { gte: startOfDay }, normalizedStatus: ShipmentProviderStatus.DELIVERED },
        }),
        this.prisma.providerShipment.count({
          where: {
            createdAt: { gte: startOfDay },
            normalizedStatus: { in: [ShipmentProviderStatus.FAILED, ShipmentProviderStatus.CANCELLED] },
          },
        }),
        this.prisma.providerShipment.aggregate({
          where: { createdAt: { gte: startOfDay }, deliveryCost: { not: null } },
          _avg: { deliveryCost: true },
        }),
        this.prisma.providerShipment.aggregate({
          where: { createdAt: { gte: startOfDay }, estimatedEtaMins: { not: null } },
          _avg: { estimatedEtaMins: true },
        }),
        this.prisma.providerWebhook.count({
          where: { createdAt: { gte: startOfDay }, status: 'FAILED' },
        }),
        this.prisma.providerHealth.findFirst({
          where: { providerType: this.registry.primaryType },
          orderBy: { lastCheckedAt: 'desc' },
        }),
      ]);

    const retryQueue = await this.prisma.providerShipment.count({
      where: {
        externalShipmentId: null,
        normalizedStatus: ShipmentProviderStatus.FAILED,
        retryCount: { lt: LOGISTICS_RETRY_MAX },
      },
    });

    return {
      activeProvider: this.registry.primaryType,
      todayShipments: todayCount,
      successRate: todayCount > 0 ? delivered / todayCount : 0,
      failureRate: todayCount > 0 ? failed / todayCount : 0,
      averageDeliveryCost: avgCost._avg.deliveryCost ? Number(avgCost._avg.deliveryCost) : null,
      averageEtaMins: avgEta._avg.estimatedEtaMins,
      webhookFailures,
      providerHealth: unhealthy,
      retryQueue,
    };
  }
}
