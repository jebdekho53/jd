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
var HotspotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotspotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const order_status_groups_1 = require("../order/order-status-groups");
let HotspotService = HotspotService_1 = class HotspotService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(HotspotService_1.name);
    }
    async generateHotspots() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const orders = await this.prisma.order.groupBy({
            by: ['storeId'],
            where: {
                createdAt: { gte: thirtyDaysAgo },
                status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 50,
        });
        let count = 0;
        for (const row of orders) {
            const store = await this.prisma.store.findUnique({
                where: { id: row.storeId },
                include: { city: true },
            });
            if (!store)
                continue;
            const searchHits = await this.prisma.searchEvent.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            });
            const demandScore = Math.min(100, row._count.id * 2 + searchHits / 100);
            const topCategory = await this.prisma.orderItem.groupBy({
                by: ['productId'],
                where: { order: { storeId: store.id, createdAt: { gte: thirtyDaysAgo } } },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 1,
            });
            let categoryId = null;
            if (topCategory[0]) {
                const product = await this.prisma.product.findUnique({
                    where: { id: topCategory[0].productId },
                    select: { categoryId: true },
                });
                categoryId = product?.categoryId ?? null;
            }
            const locality = store.locality ?? 'Central';
            const existing = await this.prisma.demandHotspot.findFirst({
                where: { city: store.city.name, locality, categoryId },
            });
            if (existing) {
                await this.prisma.demandHotspot.update({
                    where: { id: existing.id },
                    data: { demandScore },
                });
            }
            else {
                await this.prisma.demandHotspot.create({
                    data: {
                        city: store.city.name,
                        locality,
                        categoryId,
                        demandScore,
                    },
                });
            }
            count++;
        }
        this.logger.log(`Generated ${count} demand hotspots`);
        return count;
    }
    async getHotspots(limit = 50) {
        return this.prisma.demandHotspot.findMany({
            orderBy: { demandScore: 'desc' },
            include: { category: { select: { name: true } } },
            take: limit,
        });
    }
};
exports.HotspotService = HotspotService;
exports.HotspotService = HotspotService = HotspotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HotspotService);
//# sourceMappingURL=hotspot.service.js.map