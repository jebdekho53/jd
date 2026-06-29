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
exports.FranchiseAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const order_status_groups_1 = require("../order/order-status-groups");
let FranchiseAnalyticsService = class FranchiseAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAdminFranchiseAnalytics() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [franchiseCount, cityPlans, gmvAgg, orders] = await Promise.all([
            this.prisma.franchisePartner.count({ where: { status: 'ACTIVE' } }),
            this.prisma.cityLaunchPlan.findMany({ orderBy: { actualGmv: 'desc' }, take: 10 }),
            this.prisma.order.aggregate({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                },
                _sum: { totalAmount: true },
            }),
            this.prisma.order.count({
                where: { createdAt: { gte: thirtyDaysAgo }, status: client_1.OrderStatus.DELIVERED },
            }),
        ]);
        const pipeline = await this.prisma.cityLaunchPlan.groupBy({
            by: ['launchStatus'],
            _count: { id: true },
        });
        const franchiseGmv = await this.prisma.franchiseSettlement.aggregate({
            _sum: { grossGmv: true, franchiseShare: true },
        });
        return {
            activeFranchises: franchiseCount,
            platformGmv30d: Number(gmvAgg._sum.totalAmount ?? 0),
            franchiseGmvTotal: Number(franchiseGmv._sum.grossGmv ?? 0),
            franchiseShareTotal: Number(franchiseGmv._sum.franchiseShare ?? 0),
            ordersDelivered30d: orders,
            cityGmv: cityPlans.map((c) => ({
                city: c.city,
                state: c.state,
                gmv: Number(c.actualGmv),
                readinessScore: c.readinessScore,
                launchStatus: c.launchStatus,
            })),
            expansionPipeline: pipeline,
            territoryUtilization: cityPlans.length > 0
                ? Math.round(cityPlans.reduce((s, c) => s + (c.actualStores / Math.max(1, c.targetStores)), 0) / cityPlans.length * 100)
                : 0,
        };
    }
    async getFranchiseDashboard(franchiseId) {
        const fp = await this.prisma.franchisePartner.findUnique({
            where: { id: franchiseId },
            include: {
                stores: { include: { store: { select: { id: true, name: true } } } },
                territories: true,
            },
        });
        if (!fp)
            return null;
        const storeIds = fp.stores.map((s) => s.storeId);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [gmv, orderCount, riders] = await Promise.all([
            storeIds.length > 0
                ? this.prisma.order.aggregate({
                    where: {
                        storeId: { in: storeIds },
                        createdAt: { gte: thirtyDaysAgo },
                        status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                    },
                    _sum: { totalAmount: true },
                })
                : { _sum: { totalAmount: null } },
            storeIds.length > 0
                ? this.prisma.order.count({
                    where: { storeId: { in: storeIds }, createdAt: { gte: thirtyDaysAgo } },
                })
                : 0,
            this.prisma.riderProfile.count({ where: { status: { in: ['ONLINE', 'ON_DELIVERY'] } } }),
        ]);
        const gmvNum = Number(gmv._sum.totalAmount ?? 0);
        const revenueShare = gmvNum * (fp.commissionPercent / 100);
        return {
            businessName: fp.businessName,
            status: fp.status,
            gmv30d: gmvNum,
            orders30d: orderCount,
            revenueShare,
            commissionPercent: fp.commissionPercent,
            storeCount: fp.stores.length,
            riderCount: riders,
            territories: fp.territories,
            pincodes: fp.territories.flatMap((t) => t.pincodes),
        };
    }
};
exports.FranchiseAnalyticsService = FranchiseAnalyticsService;
exports.FranchiseAnalyticsService = FranchiseAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FranchiseAnalyticsService);
//# sourceMappingURL=franchise-analytics.service.js.map