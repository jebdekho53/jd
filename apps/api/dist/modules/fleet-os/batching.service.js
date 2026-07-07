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
var BatchingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchingService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const batching_util_1 = require("./batching.util");
const fleet_os_events_1 = require("./fleet-os.events");
const rider_assignment_util_1 = require("../rider-assignment/rider-assignment.util");
let BatchingService = BatchingService_1 = class BatchingService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
        this.logger = new common_1.Logger(BatchingService_1.name);
    }
    async createBatchesForRider(riderId) {
        const existing = await this.prisma.deliveryBatch.findFirst({
            where: { riderId, status: { in: [client_1.DeliveryBatchStatus.PLANNED, client_1.DeliveryBatchStatus.ACTIVE] } },
        });
        if (existing)
            return existing;
        const deliveries = await this.prisma.delivery.findMany({
            where: { riderProfileId: riderId, status: { in: ['ASSIGNED', 'ACCEPTED'] } },
            include: { order: { include: { store: true } } },
            take: 10,
        });
        if (deliveries.length === 0)
            return null;
        const batchable = deliveries.map((d) => ({
            orderId: d.orderId,
            locality: d.order.store.locality ?? 'Central',
            pickupZoneId: d.order.storeId,
            deliveryLat: d.deliveryLat,
            deliveryLng: d.deliveryLng,
        }));
        const groups = (0, batching_util_1.groupOrdersIntoBatches)(batchable);
        const first = groups[0];
        if (!first?.length)
            return null;
        const batch = await this.prisma.deliveryBatch.create({
            data: {
                riderId,
                status: client_1.DeliveryBatchStatus.PLANNED,
                totalOrders: first.length,
                items: {
                    create: first.map((o, i) => ({
                        orderId: o.orderId,
                        sequence: i + 1,
                    })),
                },
            },
            include: { items: true },
        });
        this.events.emit(`ws.${fleet_os_events_1.FLEET_EVENTS.BATCH_CREATED}`, { batch });
        this.logger.log(`Created batch ${batch.id} with ${first.length} orders for rider ${riderId}`);
        return batch;
    }
    async autoBatchUnassigned() {
        const orders = await this.prisma.order.findMany({
            where: (0, rider_assignment_util_1.unassignedOrderWhere)(),
            include: { store: true },
            take: 30,
        });
        if (orders.length < 2)
            return [];
        const batchable = orders.map((o) => ({
            orderId: o.id,
            locality: o.store.locality ?? 'Central',
            pickupZoneId: o.storeId,
            deliveryLat: o.deliveryLat,
            deliveryLng: o.deliveryLng,
        }));
        const groups = (0, batching_util_1.groupOrdersIntoBatches)(batchable);
        return groups.filter((g) => g.length > 1);
    }
    async getRiderBatch(riderId) {
        return this.prisma.deliveryBatch.findFirst({
            where: { riderId, status: { in: [client_1.DeliveryBatchStatus.PLANNED, client_1.DeliveryBatchStatus.ACTIVE] } },
            include: {
                items: {
                    include: { order: { select: { id: true, orderNumber: true, status: true } } },
                    orderBy: { sequence: 'asc' },
                },
            },
        });
    }
    async getOrderBatchInfo(orderId) {
        const item = await this.prisma.deliveryBatchItem.findUnique({
            where: { orderId },
            include: {
                batch: {
                    include: {
                        items: { include: { order: { select: { orderNumber: true } } }, orderBy: { sequence: 'asc' } },
                    },
                },
            },
        });
        if (!item)
            return { isBatched: false };
        return {
            isBatched: item.batch.totalOrders > 1,
            batchId: item.batchId,
            batchStatus: item.batch.status,
            sequence: item.sequence,
            totalOrders: item.batch.totalOrders,
            orders: item.batch.items.map((i) => i.order.orderNumber),
        };
    }
    async listActiveBatches() {
        return this.prisma.deliveryBatch.findMany({
            where: { status: { in: [client_1.DeliveryBatchStatus.PLANNED, client_1.DeliveryBatchStatus.ACTIVE] } },
            include: {
                rider: { select: { id: true, name: true } },
                items: { include: { order: { select: { orderNumber: true } } } },
            },
            take: 50,
        });
    }
};
exports.BatchingService = BatchingService;
exports.BatchingService = BatchingService = BatchingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], BatchingService);
//# sourceMappingURL=batching.service.js.map