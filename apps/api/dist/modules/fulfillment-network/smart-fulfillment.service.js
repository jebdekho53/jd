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
var SmartFulfillmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartFulfillmentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const delivery_eta_util_1 = require("../../common/utils/delivery-eta.util");
const capacity_service_1 = require("./capacity.service");
const order_status_groups_1 = require("../order/order-status-groups");
const smart_fulfillment_util_1 = require("./smart-fulfillment.util");
let SmartFulfillmentService = SmartFulfillmentService_1 = class SmartFulfillmentService {
    constructor(prisma, capacity) {
        this.prisma = prisma;
        this.capacity = capacity;
        this.logger = new common_1.Logger(SmartFulfillmentService_1.name);
    }
    async allocateOrder(orderId) {
        const existing = await this.prisma.fulfillmentOrder.count({ where: { orderId } });
        if (existing > 0)
            return;
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                store: { select: { id: true, merchantProfileId: true, latitude: true, longitude: true } },
            },
        });
        if (!order)
            return;
        const candidates = await this.getEligibleStores(order.store.merchantProfileId, order.storeId);
        if (candidates.length === 0) {
            await this.createSingleFulfillment(orderId, order.storeId, order.items, null);
            return;
        }
        const allocations = await this.routeItems(order.items.map((i) => ({
            orderItemId: i.id,
            variantId: i.variantId,
            sku: i.sku,
            quantity: i.quantity,
        })), candidates, order.deliveryLat, order.deliveryLng);
        const byStore = new Map();
        for (const a of allocations) {
            const list = byStore.get(a.storeId) ?? [];
            list.push(a);
            byStore.set(a.storeId, list);
        }
        const isSplit = byStore.size > 1;
        const network = await this.prisma.storeNetwork.findFirst({
            where: { merchantProfileId: order.store.merchantProfileId, isActive: true },
        });
        await this.prisma.$transaction(async (tx) => {
            for (const [storeId, items] of byStore) {
                const candidate = candidates.find((c) => c.storeId === storeId);
                const distKm = (0, delivery_eta_util_1.haversineKm)(candidate.latitude, candidate.longitude, order.deliveryLat, order.deliveryLng);
                const etaMins = (0, smart_fulfillment_util_1.estimateEtaMins)(distKm, candidate.avgPrepTimeMins);
                const score = await this.scoreStoreForItems(candidate, items, distKm, order.deliveryLat, order.deliveryLng);
                const fo = await tx.fulfillmentOrder.create({
                    data: {
                        orderId,
                        fulfillmentStoreId: storeId,
                        status: client_1.FulfillmentOrderStatus.ALLOCATED,
                        etaMins,
                        routingScore: score,
                        items: {
                            create: items.map((i) => ({
                                orderItemId: i.orderItemId,
                                variantId: i.variantId,
                                quantity: i.quantity,
                            })),
                        },
                    },
                });
                await tx.fulfillmentAudit.create({
                    data: {
                        networkId: network?.id,
                        orderId,
                        storeId,
                        action: isSplit ? client_1.FulfillmentAuditAction.SPLIT_CREATED : client_1.FulfillmentAuditAction.ROUTE_SELECTED,
                        metadata: { fulfillmentOrderId: fo.id, score, etaMins, isSplit },
                    },
                });
            }
            if (isSplit) {
                await tx.order.update({ where: { id: orderId }, data: { isSplitFulfillment: true } });
            }
        });
        const primaryStoreId = [...byStore.keys()][0];
        await this.setPrimaryFulfillmentSource(orderId, primaryStoreId);
        this.logger.log({ orderId, fulfillmentNodes: byStore.size, isSplit }, 'Fulfillment allocated');
    }
    async getFulfillmentSourceForOrder(orderId) {
        const fo = await this.prisma.fulfillmentOrder.findFirst({
            where: { orderId },
            orderBy: { routingScore: 'asc' },
            select: { fulfillmentStoreId: true },
        });
        return fo?.fulfillmentStoreId ?? null;
    }
    async setPrimaryFulfillmentSource(orderId, fulfillmentStoreId) {
        const delivery = await this.prisma.delivery.findUnique({ where: { orderId } });
        if (delivery) {
            await this.prisma.delivery.update({
                where: { id: delivery.id },
                data: { fulfillmentStoreId },
            });
        }
    }
    async createSingleFulfillment(orderId, storeId, items, score) {
        await this.prisma.fulfillmentOrder.create({
            data: {
                orderId,
                fulfillmentStoreId: storeId,
                status: client_1.FulfillmentOrderStatus.ALLOCATED,
                routingScore: score ?? undefined,
                items: {
                    create: items.map((i) => ({
                        orderItemId: i.id,
                        variantId: i.variantId,
                        quantity: i.quantity,
                    })),
                },
            },
        });
    }
    async getEligibleStores(merchantProfileId, primaryStoreId) {
        const network = await this.prisma.storeNetwork.findFirst({
            where: { merchantProfileId, isActive: true },
            include: {
                hubs: {
                    include: {
                        store: {
                            select: {
                                id: true,
                                name: true,
                                storeType: true,
                                latitude: true,
                                longitude: true,
                                avgPrepTimeMins: true,
                                deliveryFee: true,
                                ratingAvg: true,
                                status: true,
                                isActive: true,
                                deletedAt: true,
                            },
                        },
                    },
                },
            },
        });
        const baseWhere = {
            merchantProfileId,
            status: client_1.StoreStatus.APPROVED,
            isActive: true,
            deletedAt: null,
        };
        const stores = network
            ? network.hubs.map((h) => h.store).filter((s) => s.status === client_1.StoreStatus.APPROVED && s.isActive && !s.deletedAt)
            : await this.prisma.store.findMany({
                where: baseWhere,
                select: {
                    id: true,
                    name: true,
                    storeType: true,
                    latitude: true,
                    longitude: true,
                    avgPrepTimeMins: true,
                    deliveryFee: true,
                    ratingAvg: true,
                },
            });
        if (stores.length === 0) {
            const primary = await this.prisma.store.findUnique({
                where: { id: primaryStoreId },
                select: {
                    id: true,
                    name: true,
                    storeType: true,
                    latitude: true,
                    longitude: true,
                    avgPrepTimeMins: true,
                    deliveryFee: true,
                    ratingAvg: true,
                },
            });
            return primary ? [{ ...primary, storeId: primary.id, deliveryFee: Number(primary.deliveryFee) }] : [];
        }
        const eligible = [];
        for (const s of stores) {
            const cap = await this.capacity.getLatestCapacity(s.id);
            if (cap && cap.currentLoadPct >= smart_fulfillment_util_1.CAPACITY_OVERLOAD_THRESHOLD) {
                await this.prisma.fulfillmentAudit.create({
                    data: {
                        storeId: s.id,
                        action: client_1.FulfillmentAuditAction.CAPACITY_BLOCKED,
                        metadata: { loadPct: cap.currentLoadPct },
                    },
                });
                continue;
            }
            eligible.push({
                storeId: s.id,
                name: s.name,
                storeType: s.storeType,
                latitude: s.latitude,
                longitude: s.longitude,
                avgPrepTimeMins: s.avgPrepTimeMins,
                deliveryFee: Number(s.deliveryFee),
                ratingAvg: s.ratingAvg,
            });
        }
        return eligible.length > 0 ? eligible : stores.map((s) => ({
            storeId: s.id,
            name: s.name,
            storeType: s.storeType,
            latitude: s.latitude,
            longitude: s.longitude,
            avgPrepTimeMins: s.avgPrepTimeMins,
            deliveryFee: Number(s.deliveryFee),
            ratingAvg: s.ratingAvg,
        }));
    }
    async routeItems(items, candidates, deliveryLat, deliveryLng) {
        const scores = await Promise.all(candidates.map(async (c) => ({
            candidate: c,
            score: await this.scoreStoreForAllItems(c, items, deliveryLat, deliveryLng),
            canFulfillAll: await this.canFulfillAll(c.storeId, items),
        })));
        const fullFulfillers = scores.filter((s) => s.canFulfillAll).sort((a, b) => a.score - b.score);
        if (fullFulfillers.length > 0) {
            const best = fullFulfillers[0].candidate;
            return items.map((i) => ({
                ...i,
                storeId: best.storeId,
                variantIdAtStore: i.variantId,
            }));
        }
        const allocations = [];
        for (const item of items) {
            let bestStore = null;
            let bestScore = Number.POSITIVE_INFINITY;
            for (const c of candidates) {
                const avail = await this.getAvailableAtStore(c.storeId, item.sku, item.variantId);
                if (avail < item.quantity)
                    continue;
                const distKm = (0, delivery_eta_util_1.haversineKm)(c.latitude, c.longitude, deliveryLat, deliveryLng);
                const score = await this.scoreStoreForItems(c, [{ ...item, storeId: c.storeId, variantIdAtStore: item.variantId }], distKm, deliveryLat, deliveryLng);
                if (score < bestScore) {
                    bestScore = score;
                    bestStore = c;
                }
            }
            if (!bestStore) {
                bestStore = candidates[0];
            }
            allocations.push({
                orderItemId: item.orderItemId,
                variantId: item.variantId,
                sku: item.sku,
                quantity: item.quantity,
                storeId: bestStore.storeId,
                variantIdAtStore: item.variantId,
            });
        }
        return allocations;
    }
    async canFulfillAll(storeId, items) {
        for (const item of items) {
            const avail = await this.getAvailableAtStore(storeId, item.sku, item.variantId);
            if (avail < item.quantity)
                return false;
        }
        return true;
    }
    async getAvailableAtStore(storeId, sku, fallbackVariantId) {
        const variant = await this.prisma.productVariant.findFirst({
            where: {
                OR: [{ id: fallbackVariantId }, { sku, product: { storeId } }],
                product: { storeId, isActive: true },
                isActive: true,
            },
            include: { inventory: true },
        });
        return variant?.inventory?.availableQty ?? 0;
    }
    async scoreStoreForAllItems(candidate, items, deliveryLat, deliveryLng) {
        const distKm = (0, delivery_eta_util_1.haversineKm)(candidate.latitude, candidate.longitude, deliveryLat, deliveryLng);
        const itemAllocs = items.map((i) => ({
            orderItemId: '',
            variantId: i.variantId,
            sku: i.sku,
            quantity: i.quantity,
            storeId: candidate.storeId,
            variantIdAtStore: i.variantId,
        }));
        return this.scoreStoreForItems(candidate, itemAllocs, distKm, deliveryLat, deliveryLng);
    }
    async scoreStoreForItems(candidate, items, distKm, _deliveryLat, _deliveryLng) {
        let totalQty = 0;
        let availableQty = 0;
        for (const item of items) {
            const avail = await this.getAvailableAtStore(candidate.storeId, item.sku, item.variantId);
            totalQty += item.quantity;
            availableQty += Math.min(avail, item.quantity);
        }
        const cap = await this.capacity.getLatestCapacity(candidate.storeId);
        const delivered = await this.prisma.order.count({
            where: {
                storeId: candidate.storeId,
                status: client_1.OrderStatus.DELIVERED,
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });
        const cancelled = await this.prisma.order.count({
            where: {
                storeId: candidate.storeId,
                status: { in: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });
        const successRate = delivered + cancelled > 0 ? delivered / (delivered + cancelled) : 0.9;
        const input = {
            inventoryAvailability: totalQty > 0 ? availableQty / totalQty : 0,
            etaMins: (0, smart_fulfillment_util_1.estimateEtaMins)(distKm, candidate.avgPrepTimeMins),
            capacityLoadPct: cap?.currentLoadPct ?? 30,
            deliverySuccessRate: successRate,
            fulfillmentCost: candidate.deliveryFee + distKm * 5,
        };
        return (0, smart_fulfillment_util_1.computeRoutingScore)(input);
    }
};
exports.SmartFulfillmentService = SmartFulfillmentService;
exports.SmartFulfillmentService = SmartFulfillmentService = SmartFulfillmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        capacity_service_1.CapacityService])
], SmartFulfillmentService);
//# sourceMappingURL=smart-fulfillment.service.js.map