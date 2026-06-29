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
exports.RouteOptimizationService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../database/prisma.service");
const route_optimization_util_1 = require("./route-optimization.util");
const fleet_os_events_1 = require("./fleet-os.events");
let RouteOptimizationService = class RouteOptimizationService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async optimizeForBatch(batchId) {
        const batch = await this.prisma.deliveryBatch.findUnique({
            where: { id: batchId },
            include: {
                items: {
                    include: {
                        order: {
                            include: { store: true },
                        },
                    },
                    orderBy: { sequence: 'asc' },
                },
            },
        });
        if (!batch || batch.items.length === 0)
            return null;
        const stops = [];
        for (const item of batch.items) {
            const store = item.order.store;
            stops.push({
                orderId: item.orderId,
                lat: store.latitude,
                lng: store.longitude,
                type: 'pickup',
            });
            stops.push({
                orderId: item.orderId,
                lat: item.order.deliveryLat,
                lng: item.order.deliveryLng,
                type: 'drop',
            });
        }
        const rider = await this.prisma.riderProfile.findUnique({ where: { id: batch.riderId } });
        const start = {
            lat: rider?.currentLat ?? batch.items[0].order.store.latitude,
            lng: rider?.currentLng ?? batch.items[0].order.store.longitude,
        };
        const result = (0, route_optimization_util_1.optimizeRoute)(stops, start);
        const record = await this.prisma.routeOptimization.create({
            data: {
                riderId: batch.riderId,
                batchId: batch.id,
                distanceKm: result.distanceKm,
                estimatedMinutes: result.estimatedMinutes,
                optimized: result.optimized,
                routeSequence: result.sequence,
            },
        });
        this.events.emit(`ws.${fleet_os_events_1.FLEET_EVENTS.ROUTE_OPTIMIZED}`, { route: record, batchId });
        return record;
    }
    async getLatestForRider(riderId) {
        return this.prisma.routeOptimization.findFirst({
            where: { riderId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.RouteOptimizationService = RouteOptimizationService;
exports.RouteOptimizationService = RouteOptimizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], RouteOptimizationService);
//# sourceMappingURL=route-optimization.service.js.map