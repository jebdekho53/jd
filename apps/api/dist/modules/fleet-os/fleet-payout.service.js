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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetPayoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const fleet_payout_util_1 = require("./fleet-payout.util");
let FleetPayoutService = class FleetPayoutService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async estimateDeliveryPayout(deliveryId) {
        const delivery = await this.prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: {
                order: { include: { financialSnapshot: true, deliveryBatchItem: { include: { batch: true } } } },
            },
        });
        if (!delivery)
            return null;
        const baseEarning = Number(delivery.riderEarning ?? delivery.order.financialSnapshot?.riderPayoutAmount ?? 50);
        const batchSize = delivery.order.deliveryBatchItem?.batch.totalOrders ?? 1;
        const route = await this.prisma.routeOptimization.findFirst({
            where: { riderId: delivery.riderProfileId ?? undefined, batchId: delivery.order.deliveryBatchItem?.batchId },
            orderBy: { createdAt: 'desc' },
        });
        return (0, fleet_payout_util_1.computeFleetPayout)({
            baseEarning,
            distanceKm: delivery.distanceKm ?? route?.distanceKm ?? 3,
            batchSize,
            optimized: route?.optimized ?? false,
        });
    }
};
exports.FleetPayoutService = FleetPayoutService;
exports.FleetPayoutService = FleetPayoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FleetPayoutService);
//# sourceMappingURL=fleet-payout.service.js.map