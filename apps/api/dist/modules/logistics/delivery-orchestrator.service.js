"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeliveryOrchestratorService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const delivery_eta_util_1 = require("../../common/utils/delivery-eta.util");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const order_status_history_service_1 = require("../order/order-status-history.service");
const order_cache_service_1 = require("../order/order-cache.service");
const logistics_provider_registry_1 = require("./logistics-provider.registry");
const logistics_constants_1 = require("./logistics.constants");
const logistics_errors_1 = require("./errors/logistics.errors");
const shadowfax_status_mapper_1 = require("./mappers/shadowfax-status.mapper");
const mask_sensitive_util_1 = require("./utils/mask-sensitive.util");
const merchant_order_visibility_util_1 = require("../order/merchant-order-visibility.util");
const order_delivered_handler_service_1 = require("../order/order-delivered-handler.service");
const dispatch_eligibility_util_1 = require("./utils/dispatch-eligibility.util");
const shadowfax_awb_pool_util_1 = require("./providers/shadowfax/shadowfax-awb-pool.util");
const PROVIDER_NAMES = {
    [client_1.DeliveryProviderType.SHADOWFAX]: 'Shadowfax',
    [client_1.DeliveryProviderType.PORTER]: 'Porter',
    [client_1.DeliveryProviderType.DELHIVERY]: 'Delhivery',
    [client_1.DeliveryProviderType.BORZO]: 'Borzo',
    [client_1.DeliveryProviderType.OWN_FLEET]: 'JebDekho Riders',
};
function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function asString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
function asMoney(value) {
    if (value == null)
        return 0;
    const n = Number(value);
    return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}
function positiveMoney(value, fallback = 1) {
    return Number(Math.max(fallback, value).toFixed(2));
}
function findStringByKeys(value, keys) {
    const seen = new Set();
    const queue = [value];
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || seen.has(current))
            continue;
        seen.add(current);
        if (Array.isArray(current)) {
            queue.push(...current);
            continue;
        }
        if (typeof current !== 'object')
            continue;
        const row = current;
        for (const key of keys) {
            const found = asString(row[key]);
            if (found)
                return found;
        }
        queue.push(...Object.values(row));
    }
    return undefined;
}
function extractShipmentIdentifier(rawResponse) {
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
let DeliveryOrchestratorService = DeliveryOrchestratorService_1 = class DeliveryOrchestratorService {
    constructor(prisma, registry, domainEvents, statusHistory, orderCache, events, orderDelivered, config) {
        this.prisma = prisma;
        this.registry = registry;
        this.domainEvents = domainEvents;
        this.statusHistory = statusHistory;
        this.orderCache = orderCache;
        this.events = events;
        this.orderDelivered = orderDelivered;
        this.config = config;
        this.logger = new common_1.Logger(DeliveryOrchestratorService_1.name);
    }
    async dispatchShipment(orderId, attempt = 1, options) {
        const existing = await this.prisma.providerShipment.findUnique({
            where: { orderId },
            select: { id: true, externalShipmentId: true, trackingNumber: true, deliveryId: true, estimatedEtaMins: true },
        });
        if (existing?.externalShipmentId?.trim()) {
            return {
                shipmentId: existing.id,
                deliveryId: existing.deliveryId,
                trackingNumber: existing.trackingNumber ?? existing.externalShipmentId,
                estimatedEtaMins: existing.estimatedEtaMins,
            };
        }
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true, paymentMethod: true, paymentStatus: true, orderVertical: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const allowAssignedRepair = options?.allowAssignedRepair === true && order.status === client_1.OrderStatus.RIDER_ASSIGNED;
        if (!allowAssignedRepair && !(0, dispatch_eligibility_util_1.isDispatchEligibleOrderStatus)(order.status, order.orderVertical)) {
            throw new common_1.BadRequestException(`Cannot dispatch shipment: order status ${order.status} is not eligible for dispatch`);
        }
        if (!(0, merchant_order_visibility_util_1.isDispatchPaymentCleared)(order.paymentMethod, order.paymentStatus)) {
            throw new common_1.BadRequestException('Cannot dispatch shipment: payment not confirmed');
        }
        const providerType = this.registry.primaryType;
        if (providerType === client_1.DeliveryProviderType.OWN_FLEET) {
            throw new common_1.BadRequestException('Own fleet dispatch must use RiderAssignmentService');
        }
        const providerRecord = await this.ensureProviderRecord(providerType);
        const provider = this.registry.get(providerType);
        const input = await this.buildShipmentInput(orderId);
        try {
            const result = await provider.createShipment(input);
            const deliveryStatus = (0, shadowfax_status_mapper_1.normalizedToDeliveryStatus)(result.normalizedStatus);
            const delivery = await this.prisma.delivery.upsert({
                where: { orderId },
                create: {
                    orderId,
                    status: deliveryStatus === client_1.DeliveryStatus.PENDING ? client_1.DeliveryStatus.ASSIGNED : deliveryStatus,
                    pickupLat: input.pickup.lat,
                    pickupLng: input.pickup.lng,
                    deliveryLat: input.dropoff.lat,
                    deliveryLng: input.dropoff.lng,
                    distanceKm: (0, delivery_eta_util_1.safeDistanceKm)(input.pickup.lat, input.pickup.lng, input.dropoff.lat, input.dropoff.lng),
                    estimatedMins: result.estimatedEtaMins ?? null,
                    estimatedArrivalAt: result.estimatedArrivalAt ?? null,
                    assignedAt: new Date(),
                    assignedBy: 'logistics-orchestrator',
                },
                update: {
                    status: deliveryStatus === client_1.DeliveryStatus.PENDING ? client_1.DeliveryStatus.ASSIGNED : deliveryStatus,
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
                    deliveryCost: result.deliveryCost != null ? new client_1.Prisma.Decimal(result.deliveryCost) : null,
                    driverName: result.driverName,
                    driverPhone: result.driverPhone,
                    vehicleType: result.vehicleType,
                    labelUrl: result.labelUrl,
                    rawResponse: (0, mask_sensitive_util_1.maskSensitivePayload)(result.rawResponse ?? {}),
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
                    deliveryCost: result.deliveryCost != null ? new client_1.Prisma.Decimal(result.deliveryCost) : null,
                    driverName: result.driverName,
                    driverPhone: result.driverPhone,
                    vehicleType: result.vehicleType,
                    labelUrl: result.labelUrl,
                    rawResponse: (0, mask_sensitive_util_1.maskSensitivePayload)(result.rawResponse ?? {}),
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
                    rawPayload: (0, mask_sensitive_util_1.maskSensitivePayload)(result.rawResponse ?? {}),
                },
            });
            await this.statusHistory.transition({
                orderId,
                toStatus: client_1.OrderStatus.RIDER_ASSIGNED,
                actorType: client_1.OrderActorType.SYSTEM,
                actorId: 'logistics-orchestrator',
                note: `Shipment created via ${PROVIDER_NAMES[providerType]}`,
                skipIfAlreadyStatus: true,
            });
            void this.domainEvents.emit(client_1.DomainEventType.RIDER_ASSIGNED, 'provider_shipment', shipment.id, {
                orderId,
                providerType,
                trackingNumber: result.trackingNumber,
            });
            this.events.emit(logistics_constants_1.LOGISTICS_EVENTS.SHIPMENT_CREATED, { orderId, shipmentId: shipment.id, providerType });
            void this.orderCache.invalidateAll(orderId);
            return {
                shipmentId: shipment.id,
                deliveryId: delivery.id,
                trackingNumber: result.trackingNumber,
                estimatedEtaMins: result.estimatedEtaMins ?? null,
            };
        }
        catch (err) {
            const retryable = err instanceof logistics_errors_1.LogisticsProviderError && err.retryable;
            this.logger.error({ orderId, providerType, attempt, err }, 'Shipment creation failed');
            await this.prisma.providerShipment.upsert({
                where: { orderId },
                create: {
                    orderId,
                    providerId: providerRecord.id,
                    providerType,
                    normalizedStatus: client_1.ShipmentProviderStatus.FAILED,
                    retryCount: attempt,
                    lastError: err instanceof Error ? err.message : 'Unknown error',
                },
                update: {
                    retryCount: attempt,
                    lastError: err instanceof Error ? err.message : 'Unknown error',
                    normalizedStatus: client_1.ShipmentProviderStatus.FAILED,
                },
            });
            this.events.emit(logistics_constants_1.LOGISTICS_EVENTS.SHIPMENT_FAILED, { orderId, providerType, attempt, err });
            if (retryable && attempt < logistics_constants_1.LOGISTICS_RETRY_MAX) {
                return this.dispatchShipment(orderId, attempt + 1, options);
            }
            throw err;
        }
    }
    async retryShipment(orderId) {
        const shipment = await this.prisma.providerShipment.findUnique({ where: { orderId } });
        if (shipment?.externalShipmentId?.trim()) {
            throw new common_1.BadRequestException('Shipment already exists — cancel before retrying');
        }
        const repaired = await this.repairShipmentIdentifierFromRawResponse(shipment);
        if (repaired)
            return repaired;
        if (shipment) {
            await this.prisma.providerShipment.delete({ where: { id: shipment.id } });
        }
        return this.dispatchShipment(orderId, 1, { allowAssignedRepair: true });
    }
    async repairShipmentIdentifierFromRawResponse(shipment) {
        if (!shipment?.rawResponse || shipment.providerType !== client_1.DeliveryProviderType.SHADOWFAX)
            return null;
        const extracted = extractShipmentIdentifier(shipment.rawResponse);
        if (!extracted.externalShipmentId || !shipment.deliveryId)
            return null;
        const raw = asRecord(shipment.rawResponse);
        const providerStatus = extracted.providerStatus ?? asString(raw.status) ?? 'new';
        const normalizedStatus = (0, shadowfax_status_mapper_1.mapShadowfaxStatus)(providerStatus);
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
        this.logger.warn({
            shipmentId: shipment.id,
            externalShipmentId: updated.externalShipmentId,
        }, 'Repaired missing provider shipment identifier from raw Shadowfax response');
        return {
            shipmentId: updated.id,
            deliveryId: updated.deliveryId,
            trackingNumber: updated.trackingNumber ?? updated.externalShipmentId,
            estimatedEtaMins: updated.estimatedEtaMins,
        };
    }
    async cancelShipment(orderId, reason) {
        const shipment = await this.prisma.providerShipment.findUnique({ where: { orderId } });
        if (!shipment?.externalShipmentId) {
            throw new common_1.NotFoundException('No active provider shipment for this order');
        }
        const provider = this.registry.get(shipment.providerType);
        await provider.cancelShipment(shipment.externalShipmentId, reason);
        await this.prisma.$transaction([
            this.prisma.providerShipment.update({
                where: { id: shipment.id },
                data: {
                    normalizedStatus: client_1.ShipmentProviderStatus.CANCELLED,
                    providerStatus: 'cancelled',
                    cancelledAt: new Date(),
                },
            }),
            ...(shipment.deliveryId
                ? [
                    this.prisma.delivery.update({
                        where: { id: shipment.deliveryId },
                        data: { status: client_1.DeliveryStatus.CANCELLED },
                    }),
                ]
                : []),
        ]);
    }
    async syncShipmentTracking(orderId) {
        const shipment = await this.prisma.providerShipment.findUnique({
            where: { orderId },
            include: { delivery: true },
        });
        if (!shipment?.externalShipmentId)
            return;
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
    async applyStatusUpdate(shipmentId, providerStatus, normalizedStatus, extras) {
        const shipment = await this.prisma.providerShipment.findUnique({
            where: { id: shipmentId },
            include: { delivery: true, order: { select: { id: true, status: true } } },
        });
        if (!shipment)
            return;
        if (shipment.normalizedStatus === normalizedStatus && !extras?.driverName)
            return;
        const deliveryStatus = (0, shadowfax_status_mapper_1.normalizedToDeliveryStatus)(normalizedStatus);
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
                    deliveredAt: normalizedStatus === client_1.ShipmentProviderStatus.DELIVERED ? new Date() : undefined,
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
                            pickedUpAt: normalizedStatus === client_1.ShipmentProviderStatus.PICKED_UP ? new Date() : undefined,
                            deliveredAt: normalizedStatus === client_1.ShipmentProviderStatus.DELIVERED ? new Date() : undefined,
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
                    rawPayload: (0, mask_sensitive_util_1.maskSensitivePayload)(extras?.rawPayload ?? {}),
                },
            }),
        ]);
        await this.syncOrderStatus(shipment.orderId, normalizedStatus);
        void this.orderCache.invalidateAll(shipment.orderId);
        this.events.emit(logistics_constants_1.LOGISTICS_EVENTS.SHIPMENT_STATUS_UPDATED, {
            orderId: shipment.orderId,
            shipmentId,
            normalizedStatus,
        });
        if (normalizedStatus === client_1.ShipmentProviderStatus.DELIVERED) {
            void this.orderDelivered.handleProviderDelivered(shipment.orderId, shipment.providerType, shipment.deliveryId).catch((err) => {
                this.logger.error({ err, orderId: shipment.orderId }, 'Provider delivered handler failed');
            });
        }
    }
    async syncOrderStatus(orderId, status) {
        const target = this.orderStatusForShipment(status);
        if (!target)
            return;
        await this.statusHistory.transition({
            orderId,
            toStatus: target,
            actorType: client_1.OrderActorType.SYSTEM,
            actorId: 'logistics-orchestrator',
            note: `Provider status: ${status}`,
            skipIfAlreadyStatus: true,
        });
    }
    orderStatusForShipment(status) {
        switch (status) {
            case client_1.ShipmentProviderStatus.ASSIGNED:
            case client_1.ShipmentProviderStatus.PICKUP_STARTED:
                return client_1.OrderStatus.RIDER_ASSIGNED;
            case client_1.ShipmentProviderStatus.PICKED_UP:
                return client_1.OrderStatus.PICKED_UP;
            case client_1.ShipmentProviderStatus.IN_TRANSIT:
            case client_1.ShipmentProviderStatus.NEARBY:
                return client_1.OrderStatus.OUT_FOR_DELIVERY;
            case client_1.ShipmentProviderStatus.DELIVERED:
                return client_1.OrderStatus.DELIVERED;
            case client_1.ShipmentProviderStatus.FAILED:
                return client_1.OrderStatus.DELIVERY_FAILED;
            case client_1.ShipmentProviderStatus.CANCELLED:
                return client_1.OrderStatus.CANCELLED_BY_MERCHANT;
            default:
                return null;
        }
    }
    async ensureProviderRecord(type) {
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
    async buildShipmentInput(orderId) {
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
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const addr = order.deliveryAddress;
        const payerContact = await this.resolvePayerContact(orderId);
        const codAmount = order.paymentMethod === 'COD' ? Number(order.totalAmount) : undefined;
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
        const packageWeight = Math.max(500, shipmentItems.reduce((sum, item) => sum + (item.weightGrams ?? 0) * item.quantity, 0));
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
    async allocateShadowfaxAwb(orderId) {
        if (this.registry.primaryType !== client_1.DeliveryProviderType.SHADOWFAX)
            return undefined;
        const awbs = this.shadowfaxPreallocatedAwbs();
        if (awbs.length === 0)
            return undefined;
        const existing = await this.prisma.providerShipment.findUnique({
            where: { orderId },
            select: { externalShipmentId: true, trackingNumber: true },
        });
        const existingAwb = awbs.find((awb) => awb === existing?.externalShipmentId || awb === existing?.trackingNumber);
        if (existingAwb)
            return existingAwb;
        const used = await this.prisma.providerShipment.findMany({
            where: {
                providerType: client_1.DeliveryProviderType.SHADOWFAX,
                OR: [
                    { externalShipmentId: { in: awbs } },
                    { trackingNumber: { in: awbs } },
                ],
            },
            select: { externalShipmentId: true, trackingNumber: true },
        });
        const usedAwbs = new Set(used.flatMap((row) => [row.externalShipmentId, row.trackingNumber]).filter((value) => Boolean(value)));
        const nextAwb = awbs.find((awb) => !usedAwbs.has(awb));
        if (!nextAwb) {
            throw new logistics_errors_1.LogisticsProviderError('No unused Shadowfax preallocated AWB numbers are available', client_1.DeliveryProviderType.SHADOWFAX, 'SHADOWFAX_AWB_POOL_EXHAUSTED', false, undefined, { providerMessage: 'Shadowfax AWB pool exhausted' });
        }
        return nextAwb;
    }
    shadowfaxPreallocatedAwbs() {
        return (0, shadowfax_awb_pool_util_1.parseShadowfaxAwbPool)(this.config.get('SHADOWFAX_PREALLOCATED_AWBS', ''));
    }
    async resolvePayerContact(orderId) {
        const checkout = await this.prisma.checkout.findFirst({
            where: { orderId },
            select: { cartSnapshot: true },
        });
        if (!checkout?.cartSnapshot)
            return null;
        try {
            const snap = typeof checkout.cartSnapshot === 'string'
                ? JSON.parse(checkout.cartSnapshot)
                : checkout.cartSnapshot;
            const raw = snap.payerContact;
            if (raw?.name?.trim() && raw?.phone?.trim()) {
                return { name: raw.name.trim(), phone: raw.phone.replace(/\D/g, '').slice(-10) };
            }
        }
        catch {
            return null;
        }
        return null;
    }
    async getDashboardStats() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const [todayCount, delivered, failed, avgCost, avgEta, webhookFailures, unhealthy] = await Promise.all([
            this.prisma.providerShipment.count({ where: { createdAt: { gte: startOfDay } } }),
            this.prisma.providerShipment.count({
                where: { createdAt: { gte: startOfDay }, normalizedStatus: client_1.ShipmentProviderStatus.DELIVERED },
            }),
            this.prisma.providerShipment.count({
                where: {
                    createdAt: { gte: startOfDay },
                    normalizedStatus: { in: [client_1.ShipmentProviderStatus.FAILED, client_1.ShipmentProviderStatus.CANCELLED] },
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
                normalizedStatus: client_1.ShipmentProviderStatus.FAILED,
                retryCount: { lt: logistics_constants_1.LOGISTICS_RETRY_MAX },
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
};
exports.DeliveryOrchestratorService = DeliveryOrchestratorService;
exports.DeliveryOrchestratorService = DeliveryOrchestratorService = DeliveryOrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logistics_provider_registry_1.LogisticsProviderRegistry,
        domain_events_service_1.DomainEventsService,
        order_status_history_service_1.OrderStatusHistoryService,
        order_cache_service_1.OrderCacheService, typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object, order_delivered_handler_service_1.OrderDeliveredHandlerService, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], DeliveryOrchestratorService);
//# sourceMappingURL=delivery-orchestrator.service.js.map