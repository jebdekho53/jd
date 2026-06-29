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
exports.ExpansionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const expansion_util_1 = require("./expansion.util");
const order_status_groups_1 = require("../order/order-status-groups");
let ExpansionService = class ExpansionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async computeCityReadiness(city, state) {
        const cityRef = await this.prisma.city.findFirst({
            where: { name: { equals: city, mode: 'insensitive' } },
        });
        const [stores, riders, searchEvents, vendors, darkStores, delivered] = await Promise.all([
            this.prisma.store.count({
                where: {
                    ...(cityRef ? { cityId: cityRef.id } : {}),
                    status: client_1.StoreStatus.APPROVED,
                    isActive: true,
                },
            }),
            this.prisma.riderProfile.count({
                where: { status: { in: ['ONLINE', 'ON_DELIVERY'] } },
            }),
            this.prisma.searchEvent.count({
                where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            }),
            this.prisma.vendor.count({ where: { isActive: true } }),
            this.prisma.store.count({
                where: {
                    ...(cityRef ? { cityId: cityRef.id } : {}),
                    storeType: client_1.StoreType.DARK_STORE,
                    isActive: true,
                },
            }),
            this.prisma.order.count({
                where: {
                    ...(cityRef ? { store: { cityId: cityRef.id } } : {}),
                    status: client_1.OrderStatus.DELIVERED,
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
        ]);
        const targetStores = 50;
        const targetRiders = 100;
        const fulfillmentSla = delivered > 0 ? Math.min(1, delivered / 500) : 0.3;
        return (0, expansion_util_1.computeLaunchReadiness)({
            storeDensity: Math.min(1, stores / targetStores),
            riderSupply: Math.min(1, riders / targetRiders),
            searchDemand: Math.min(1, searchEvents / 1000),
            population: cityRef ? 0.7 : 0.4,
            procurementCoverage: Math.min(1, vendors / 20) * 0.7 + fulfillmentSla * 0.3 * (darkStores > 0 ? 1.1 : 1),
        });
    }
    async refreshCityLaunchPlan(city, state) {
        const readinessScore = await this.computeCityReadiness(city, state);
        const cityRef = await this.prisma.city.findFirst({
            where: { name: { equals: city, mode: 'insensitive' } },
        });
        const [actualStores, actualRiders, gmvAgg] = await Promise.all([
            cityRef
                ? this.prisma.store.count({ where: { cityId: cityRef.id, isActive: true } })
                : 0,
            this.prisma.riderProfile.count(),
            cityRef
                ? this.prisma.order.aggregate({
                    where: {
                        store: { cityId: cityRef.id },
                        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                    },
                    _sum: { totalAmount: true },
                })
                : { _sum: { totalAmount: null } },
        ]);
        return this.prisma.cityLaunchPlan.upsert({
            where: { city_state: { city, state } },
            create: {
                city,
                state,
                cityId: cityRef?.id,
                readinessScore,
                actualStores,
                actualRiders,
                actualGmv: gmvAgg._sum.totalAmount ?? 0,
            },
            update: {
                readinessScore,
                actualStores,
                actualRiders,
                actualGmv: gmvAgg._sum.totalAmount ?? 0,
                cityId: cityRef?.id,
            },
        });
    }
    async listCities() {
        const plans = await this.prisma.cityLaunchPlan.findMany({
            orderBy: { readinessScore: 'desc' },
            take: 50,
        });
        if (plans.length === 0) {
            await this.refreshCityLaunchPlan('Delhi', 'Delhi');
            return this.prisma.cityLaunchPlan.findMany({ orderBy: { readinessScore: 'desc' } });
        }
        return plans;
    }
    async createCityLaunch(input) {
        const readinessScore = await this.computeCityReadiness(input.city, input.state);
        return this.prisma.cityLaunchPlan.upsert({
            where: { city_state: { city: input.city, state: input.state } },
            create: {
                city: input.city,
                state: input.state,
                launchStatus: input.launchStatus ?? client_1.CityLaunchStatus.PLANNING,
                readinessScore,
                targetStores: input.targetStores ?? 20,
                targetRiders: input.targetRiders ?? 50,
                targetGmv: input.targetGmv ?? 1000000,
            },
            update: {
                launchStatus: input.launchStatus,
                targetStores: input.targetStores,
                targetRiders: input.targetRiders,
                targetGmv: input.targetGmv,
                readinessScore,
            },
        });
    }
    async triggerLaunchCampaign(city, state) {
        await this.prisma.marketingEvent
            .create({
            data: {
                eventType: client_1.MarketingEventType.CAMPAIGN_OPEN,
                metadata: { city, state, campaign: `${city} launch`, type: 'CITY_LAUNCH' },
            },
        })
            .catch(() => null);
        return { city, state, campaignTriggered: true };
    }
};
exports.ExpansionService = ExpansionService;
exports.ExpansionService = ExpansionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpansionService);
//# sourceMappingURL=expansion.service.js.map