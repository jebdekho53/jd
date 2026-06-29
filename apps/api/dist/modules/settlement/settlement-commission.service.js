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
exports.SettlementCommissionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const settlement_utils_1 = require("./settlement.utils");
const DEFAULT_COMMISSION = 15;
const DEFAULT_DELAY_DAYS = 2;
let SettlementCommissionService = class SettlementCommissionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveForOrder(merchantProfileId, orderId) {
        const merchantConfig = await this.prisma.settlementConfig.findFirst({
            where: {
                scope: client_1.SettlementConfigScope.MERCHANT,
                merchantProfileId,
                isActive: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        if (merchantConfig) {
            return {
                commissionPercent: (0, settlement_utils_1.decimalToNumber)(merchantConfig.commissionPercent),
                settlementDelayDays: merchantConfig.settlementDelayDays,
            };
        }
        const categoryId = await this.resolveDominantCategoryId(orderId);
        if (categoryId) {
            const categoryConfig = await this.prisma.settlementConfig.findFirst({
                where: {
                    scope: client_1.SettlementConfigScope.CATEGORY,
                    categoryId,
                    isActive: true,
                },
                orderBy: { updatedAt: 'desc' },
            });
            if (categoryConfig) {
                return {
                    commissionPercent: (0, settlement_utils_1.decimalToNumber)(categoryConfig.commissionPercent),
                    settlementDelayDays: categoryConfig.settlementDelayDays,
                };
            }
        }
        const globalConfig = await this.prisma.settlementConfig.findFirst({
            where: { scope: client_1.SettlementConfigScope.GLOBAL, isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
        return {
            commissionPercent: globalConfig
                ? (0, settlement_utils_1.decimalToNumber)(globalConfig.commissionPercent)
                : DEFAULT_COMMISSION,
            settlementDelayDays: globalConfig?.settlementDelayDays ?? DEFAULT_DELAY_DAYS,
        };
    }
    async resolveDominantCategoryId(orderId) {
        const items = await this.prisma.orderItem.findMany({
            where: { orderId },
            select: {
                totalPrice: true,
                product: { select: { categoryId: true } },
            },
        });
        const byCategory = new Map();
        for (const item of items) {
            const catId = item.product.categoryId;
            if (!catId)
                continue;
            byCategory.set(catId, (byCategory.get(catId) ?? 0) + (0, settlement_utils_1.decimalToNumber)(item.totalPrice));
        }
        let dominant = null;
        let max = 0;
        for (const [catId, total] of byCategory) {
            if (total > max) {
                max = total;
                dominant = catId;
            }
        }
        return dominant;
    }
};
exports.SettlementCommissionService = SettlementCommissionService;
exports.SettlementCommissionService = SettlementCommissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettlementCommissionService);
//# sourceMappingURL=settlement-commission.service.js.map