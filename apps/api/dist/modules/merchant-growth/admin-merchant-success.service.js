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
exports.AdminMerchantSuccessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
let AdminMerchantSuccessService = class AdminMerchantSuccessService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        const today = (0, ist_day_util_1.startOfIstDay)();
        const snapshots = await this.prisma.storeHealthSnapshot.findMany({
            where: { snapshotDate: today },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        merchantProfile: {
                            select: {
                                id: true,
                                businessName: true,
                                isBlacklisted: true,
                                user: { select: { phone: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { healthScore: 'desc' },
            take: 500,
        });
        const atRisk = snapshots.filter((s) => s.healthScore < 50);
        const topPerformers = snapshots.filter((s) => s.healthScore >= 80);
        const expansionReady = snapshots.filter((s) => s.healthScore >= 70 && s.visibilityScore >= 50 && s.fulfillmentPct >= 25);
        const fraudProne = snapshots.filter((s) => s.store.merchantProfile.isBlacklisted ||
            (s.fulfillmentPct < 15 && s.healthScore < 40));
        const openAlerts = await this.prisma.merchantGrowthAlert.groupBy({
            by: ['alertType'],
            where: { status: 'OPEN' },
            _count: { id: true },
        });
        const avgHealth = snapshots.length > 0
            ? Math.round(snapshots.reduce((s, x) => s + x.healthScore, 0) / snapshots.length)
            : 0;
        return {
            summary: {
                storesTracked: snapshots.length,
                avgHealthScore: avgHealth,
                atRiskCount: atRisk.length,
                topPerformerCount: topPerformers.length,
                expansionReadyCount: expansionReady.length,
                fraudProneCount: fraudProne.length,
            },
            atRisk: atRisk.slice(0, 20).map(this.mapRow),
            topPerformers: topPerformers.slice(0, 20).map(this.mapRow),
            expansionReady: expansionReady.slice(0, 20).map(this.mapRow),
            fraudProne: fraudProne.slice(0, 20).map(this.mapRow),
            alertsByType: openAlerts.map((a) => ({ type: a.alertType, count: a._count.id })),
        };
    }
    mapRow(s) {
        return {
            storeId: s.store.id,
            storeName: s.store.name,
            merchantName: s.store.merchantProfile.businessName,
            phone: s.store.merchantProfile.user.phone,
            healthScore: s.healthScore,
            visibilityScore: s.visibilityScore,
        };
    }
};
exports.AdminMerchantSuccessService = AdminMerchantSuccessService;
exports.AdminMerchantSuccessService = AdminMerchantSuccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminMerchantSuccessService);
//# sourceMappingURL=admin-merchant-success.service.js.map