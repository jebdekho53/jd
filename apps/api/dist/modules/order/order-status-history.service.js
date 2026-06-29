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
var OrderStatusHistoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatusHistoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const order_cache_service_1 = require("./order-cache.service");
let OrderStatusHistoryService = OrderStatusHistoryService_1 = class OrderStatusHistoryService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
        this.logger = new common_1.Logger(OrderStatusHistoryService_1.name);
    }
    async transition(input) {
        const order = await this.prisma.order.findUnique({
            where: { id: input.orderId },
            select: { id: true, status: true },
        });
        if (!order)
            throw new common_1.NotFoundException(`Order not found: ${input.orderId}`);
        if (input.skipIfAlreadyStatus && order.status === input.toStatus) {
            return false;
        }
        const fromStatus = order.status;
        const note = input.note ?? `Transitioned from ${fromStatus} to ${input.toStatus}`;
        const cancellationStatuses = new Set([
            client_1.OrderStatus.CANCELLED_BY_BUYER,
            client_1.OrderStatus.CANCELLED_BY_MERCHANT,
            client_1.OrderStatus.CANCELLED_BY_ADMIN,
        ]);
        const isCancellation = cancellationStatuses.has(input.toStatus);
        await this.prisma.$transaction([
            this.prisma.order.update({
                where: { id: input.orderId },
                data: {
                    status: input.toStatus,
                    ...(isCancellation && {
                        cancelledAt: new Date(),
                        cancelReason: input.note ?? undefined,
                    }),
                    ...(input.toStatus === client_1.OrderStatus.PAID && { paidAt: new Date() }),
                    ...(input.toStatus === client_1.OrderStatus.DELIVERED && { completedAt: new Date() }),
                    ...input.extraOrderData,
                },
            }),
            this.prisma.orderStatusHistory.create({
                data: {
                    orderId: input.orderId,
                    status: input.toStatus,
                    note,
                    changedBy: input.actorId,
                    actorType: input.actorType,
                    metadata: input.metadata,
                },
            }),
        ]);
        await this.cache.invalidateAll(input.orderId);
        this.logger.debug({ orderId: input.orderId, fromStatus, toStatus: input.toStatus }, 'Order status recorded');
        return true;
    }
    async appendEntry(input) {
        await this.prisma.orderStatusHistory.create({
            data: {
                orderId: input.orderId,
                status: input.status,
                note: input.note,
                changedBy: input.actorId,
                actorType: input.actorType,
                metadata: input.metadata,
            },
        });
        await this.cache.invalidateAll(input.orderId);
    }
    async recordInitial(orderId, status, actorType, note, actorId, metadata) {
        await this.appendEntry({ orderId, status, actorType, actorId, note, metadata });
    }
};
exports.OrderStatusHistoryService = OrderStatusHistoryService;
exports.OrderStatusHistoryService = OrderStatusHistoryService = OrderStatusHistoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        order_cache_service_1.OrderCacheService])
], OrderStatusHistoryService);
//# sourceMappingURL=order-status-history.service.js.map