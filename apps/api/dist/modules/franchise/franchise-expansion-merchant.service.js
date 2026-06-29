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
exports.FranchiseExpansionMerchantService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
let FranchiseExpansionMerchantService = class FranchiseExpansionMerchantService {
    constructor(prisma, merchantDashboard) {
        this.prisma = prisma;
        this.merchantDashboard = merchantDashboard;
    }
    async getExpansionOpportunities(userId, storeId) {
        const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
        if (!ctx.storeIds.length)
            return [];
        const store = await this.prisma.store.findFirst({
            where: { id: ctx.storeIds[0] },
            include: { city: true, storeHubs: true },
        });
        if (!store)
            return [];
        const darkStoresNearby = await this.prisma.store.count({
            where: {
                cityId: store.cityId,
                storeType: client_1.StoreType.DARK_STORE,
                isActive: true,
                merchantProfileId: { not: store.merchantProfileId },
            },
        });
        const cityPlan = await this.prisma.cityLaunchPlan.findFirst({
            where: { city: { equals: store.city.name, mode: 'insensitive' } },
        });
        const opportunities = [
            {
                id: 'dark-store',
                title: 'Open a dark store',
                description: 'Add a micro-fulfillment node in high-demand pincode',
                impact: 'Faster delivery · +15% conversion',
                type: 'FULFILLMENT_NODE',
            },
            {
                id: 'fulfillment-hub',
                title: 'Add fulfillment node to network',
                description: 'Join store network for smart routing',
                impact: cityPlan ? `City readiness ${Math.round(cityPlan.readinessScore)}%` : 'Expand coverage',
                type: 'NETWORK',
            },
        ];
        if (cityPlan && cityPlan.launchStatus !== 'LIVE') {
            opportunities.push({
                id: 'franchise-operator',
                title: 'Become franchise operator',
                description: `Lead ${store.city.name} expansion as franchise partner`,
                impact: `Target GMV ₹${Number(cityPlan.targetGmv).toLocaleString()}`,
                type: 'FRANCHISE',
            });
        }
        if (darkStoresNearby < 3) {
            opportunities.push({
                id: 'expansion-lead',
                title: 'Expansion opportunity in your city',
                description: 'Low dark store density — first-mover advantage',
                impact: 'High demand corridor',
                type: 'EXPANSION',
            });
        }
        return opportunities;
    }
};
exports.FranchiseExpansionMerchantService = FranchiseExpansionMerchantService;
exports.FranchiseExpansionMerchantService = FranchiseExpansionMerchantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_dashboard_service_1.MerchantDashboardService])
], FranchiseExpansionMerchantService);
//# sourceMappingURL=franchise-expansion-merchant.service.js.map