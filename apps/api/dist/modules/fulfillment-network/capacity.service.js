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
exports.CapacityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
const order_status_groups_1 = require("../order/order-status-groups");
let CapacityService = class CapacityService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLatestCapacity(storeId) {
        return this.prisma.storeCapacitySnapshot.findFirst({
            where: { storeId },
            orderBy: { snapshotAt: 'desc' },
        });
    }
    async snapshotStoreCapacity(storeId) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const [ordersLastHour, backlog] = await Promise.all([
            this.prisma.order.count({
                where: {
                    storeId,
                    createdAt: { gte: oneHourAgo },
                    status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                },
            }),
            this.prisma.order.count({
                where: {
                    storeId,
                    status: {
                        in: [client_1.OrderStatus.CREATED, client_1.OrderStatus.PAID, client_1.OrderStatus.MERCHANT_ACCEPTED, client_1.OrderStatus.PREPARING],
                    },
                },
            }),
        ]);
        const ordersPerHour = ordersLastHour;
        const pickersAvailable = Math.max(1, 3 - Math.floor(backlog / 5));
        const packingStations = 2;
        const currentLoadPct = Math.min(100, backlog * 8 + ordersPerHour * 2);
        const peakLoadPct = Math.min(100, currentLoadPct * 1.2);
        return this.prisma.storeCapacitySnapshot.create({
            data: {
                storeId,
                ordersPerHour,
                pickersAvailable,
                packingStations,
                currentLoadPct,
                peakLoadPct,
                backlogCount: backlog,
            },
        });
    }
    async listNetworkCapacity(storeIds) {
        const snapshots = await Promise.all(storeIds.map((id) => this.getLatestCapacity(id)));
        return storeIds.map((storeId, i) => ({
            storeId,
            snapshot: snapshots[i],
        }));
    }
};
exports.CapacityService = CapacityService;
exports.CapacityService = CapacityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CapacityService);
//# sourceMappingURL=capacity.service.js.map