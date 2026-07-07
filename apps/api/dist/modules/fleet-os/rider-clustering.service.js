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
var RiderClusteringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderClusteringService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fleet_os_events_1 = require("./fleet-os.events");
let RiderClusteringService = RiderClusteringService_1 = class RiderClusteringService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
        this.logger = new common_1.Logger(RiderClusteringService_1.name);
    }
    async refreshClusters() {
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, status: 'APPROVED' },
            include: { city: true },
            take: 200,
        });
        const clusterMap = new Map();
        for (const store of stores) {
            const key = `${store.city.name}|${store.locality ?? 'Central'}`;
            const entry = clusterMap.get(key) ?? {
                city: store.city.name,
                locality: store.locality ?? 'Central',
                riders: 0,
                orders: 0,
            };
            clusterMap.set(key, entry);
        }
        const onlineRiders = await this.prisma.riderProfile.findMany({
            where: { status: { in: [client_1.RiderStatus.ONLINE, client_1.RiderStatus.ON_DELIVERY] } },
            select: { id: true, currentLat: true, currentLng: true },
        });
        for (const rider of onlineRiders) {
            if (rider.currentLat == null || rider.currentLng == null)
                continue;
            const nearest = stores[0];
            if (!nearest)
                continue;
            const key = `${nearest.city.name}|${nearest.locality ?? 'Central'}`;
            const entry = clusterMap.get(key);
            if (entry)
                entry.riders++;
        }
        const activeOrders = await this.prisma.order.findMany({
            where: {
                delivery: { status: { in: [client_1.DeliveryStatus.ASSIGNED, client_1.DeliveryStatus.ACCEPTED, client_1.DeliveryStatus.PICKED_UP] } },
            },
            include: { store: { include: { city: true } } },
            take: 500,
        });
        for (const order of activeOrders) {
            const key = `${order.store.city.name}|${order.store.locality ?? 'Central'}`;
            const entry = clusterMap.get(key);
            if (entry)
                entry.orders++;
        }
        const results = [];
        for (const entry of clusterMap.values()) {
            const ratio = entry.riders > 0 ? entry.orders / entry.riders : entry.orders;
            const cluster = await this.prisma.riderCluster.upsert({
                where: { city_locality: { city: entry.city, locality: entry.locality } },
                update: {
                    activeRiders: entry.riders,
                    activeOrders: entry.orders,
                    demandSupplyRatio: Math.round(ratio * 100) / 100,
                },
                create: {
                    city: entry.city,
                    locality: entry.locality,
                    activeRiders: entry.riders,
                    activeOrders: entry.orders,
                    demandSupplyRatio: Math.round(ratio * 100) / 100,
                },
            });
            results.push(cluster);
        }
        this.events.emit(`ws.${fleet_os_events_1.FLEET_EVENTS.CLUSTER_UPDATED}`, { clusters: results });
        this.logger.log(`Refreshed ${results.length} rider clusters`);
        return results;
    }
    async listClusters() {
        return this.prisma.riderCluster.findMany({
            orderBy: { demandSupplyRatio: 'desc' },
            take: 100,
        });
    }
};
exports.RiderClusteringService = RiderClusteringService;
exports.RiderClusteringService = RiderClusteringService = RiderClusteringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], RiderClusteringService);
//# sourceMappingURL=rider-clustering.service.js.map