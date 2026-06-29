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
var FleetBalancingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetBalancingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let FleetBalancingService = FleetBalancingService_1 = class FleetBalancingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(FleetBalancingService_1.name);
    }
    async getBalanceSuggestions() {
        const clusters = await this.prisma.riderCluster.findMany({
            orderBy: { demandSupplyRatio: 'desc' },
            take: 20,
        });
        if (clusters.length < 2)
            return [];
        const highSupply = clusters.filter((c) => c.activeRiders > 2 && c.demandSupplyRatio < 1);
        const lowSupply = clusters.filter((c) => c.demandSupplyRatio > 2);
        const suggestions = [];
        for (const low of lowSupply) {
            const donor = highSupply.find((h) => h.city === low.city);
            if (donor) {
                suggestions.push({
                    from: { city: donor.city, locality: donor.locality, riders: donor.activeRiders },
                    to: { city: low.city, locality: low.locality, orders: low.activeOrders },
                    ridersToMove: 1,
                });
            }
        }
        return suggestions;
    }
    async countOnlineRiders() {
        return this.prisma.riderProfile.count({
            where: { status: { in: [client_1.RiderStatus.ONLINE, client_1.RiderStatus.ON_DELIVERY] } },
        });
    }
};
exports.FleetBalancingService = FleetBalancingService;
exports.FleetBalancingService = FleetBalancingService = FleetBalancingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FleetBalancingService);
//# sourceMappingURL=fleet-balancing.service.js.map