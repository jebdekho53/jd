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
var FleetAlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetAlertService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fleet_os_events_1 = require("./fleet-os.events");
let FleetAlertService = FleetAlertService_1 = class FleetAlertService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
        this.logger = new common_1.Logger(FleetAlertService_1.name);
    }
    async scanAndCreateAlerts() {
        const created = [];
        const clusters = await this.prisma.riderCluster.findMany({ take: 50 });
        for (const c of clusters) {
            if (c.activeOrders > 5 && c.activeRiders < 2) {
                const alert = await this.createAlert(client_1.FleetAlertType.LOW_RIDER_SUPPLY, `Low rider supply in ${c.locality}, ${c.city}`, { city: c.city, locality: c.locality });
                created.push(alert);
            }
            if (c.demandSupplyRatio > 3) {
                const alert = await this.createAlert(client_1.FleetAlertType.ORDER_SURGE, `Order surge in ${c.locality} — ratio ${c.demandSupplyRatio}`, { city: c.city, locality: c.locality });
                created.push(alert);
            }
            if (c.activeRiders > 3 && c.activeOrders === 0) {
                const alert = await this.createAlert(client_1.FleetAlertType.CLUSTER_IMBALANCE, `Rider oversupply in ${c.locality}`, { city: c.city, locality: c.locality });
                created.push(alert);
            }
        }
        const slow = await this.prisma.delivery.count({
            where: {
                status: client_1.DeliveryStatus.PICKED_UP,
                pickedUpAt: { lt: new Date(Date.now() - 45 * 60 * 1000) },
            },
        });
        if (slow > 0) {
            const alert = await this.createAlert(client_1.FleetAlertType.SLOW_DELIVERIES, `${slow} deliveries delayed beyond 45 minutes`, {});
            created.push(alert);
        }
        this.logger.log(`Created ${created.length} fleet alerts`);
        return created;
    }
    async listOpenAlerts() {
        return this.prisma.fleetAlert.findMany({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async createAlert(alertType, message, meta) {
        const existing = await this.prisma.fleetAlert.findFirst({
            where: {
                alertType,
                status: 'OPEN',
                city: meta.city ?? null,
                locality: meta.locality ?? null,
                createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
            },
        });
        if (existing)
            return existing;
        const alert = await this.prisma.fleetAlert.create({
            data: {
                alertType,
                message,
                city: meta.city,
                locality: meta.locality,
                riderProfileId: meta.riderProfileId,
                metadata: meta,
            },
        });
        this.events.emit(`ws.${fleet_os_events_1.FLEET_EVENTS.ALERT_CREATED}`, { alert });
        return alert;
    }
};
exports.FleetAlertService = FleetAlertService;
exports.FleetAlertService = FleetAlertService = FleetAlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], FleetAlertService);
//# sourceMappingURL=fleet-alert.service.js.map