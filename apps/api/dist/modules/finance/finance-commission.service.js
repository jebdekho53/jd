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
exports.FinanceCommissionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const settlement_commission_service_1 = require("../settlement/settlement-commission.service");
const settlement_utils_1 = require("../settlement/settlement.utils");
const DEFAULT_COMMISSION = 15;
let FinanceCommissionService = class FinanceCommissionService {
    constructor(prisma, legacy) {
        this.prisma = prisma;
        this.legacy = legacy;
    }
    async resolveForOrder(storeId, orderId) {
        const campaignRule = await this.findCampaignRule(storeId);
        if (campaignRule)
            return campaignRule;
        const storeRule = await this.prisma.commissionRule.findFirst({
            where: { scope: client_1.CommissionRuleScope.STORE, storeId, isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
        if (storeRule) {
            return {
                commissionPercent: (0, settlement_utils_1.decimalToNumber)(storeRule.commissionPercent),
                settlementDelayDays: storeRule.settlementDelayDays,
                commissionRuleId: storeRule.id,
                ruleScope: 'STORE',
            };
        }
        const categoryId = await this.resolveDominantCategoryId(orderId);
        if (categoryId) {
            const categoryRule = await this.prisma.commissionRule.findFirst({
                where: { scope: client_1.CommissionRuleScope.CATEGORY, categoryId, isActive: true },
                orderBy: { updatedAt: 'desc' },
            });
            if (categoryRule) {
                return {
                    commissionPercent: (0, settlement_utils_1.decimalToNumber)(categoryRule.commissionPercent),
                    settlementDelayDays: categoryRule.settlementDelayDays,
                    commissionRuleId: categoryRule.id,
                    ruleScope: 'CATEGORY',
                };
            }
        }
        const globalRule = await this.prisma.commissionRule.findFirst({
            where: { scope: client_1.CommissionRuleScope.GLOBAL, isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
        if (globalRule) {
            return {
                commissionPercent: (0, settlement_utils_1.decimalToNumber)(globalRule.commissionPercent),
                settlementDelayDays: globalRule.settlementDelayDays,
                commissionRuleId: globalRule.id,
                ruleScope: 'GLOBAL',
            };
        }
        const legacy = await this.legacy.resolveForOrder(await this.merchantProfileIdForStore(storeId), orderId);
        return {
            ...legacy,
            commissionRuleId: null,
            ruleScope: 'LEGACY_CONFIG',
        };
    }
    async findCampaignRule(storeId) {
        const now = new Date();
        const campaign = await this.prisma.campaign.findFirst({
            where: {
                storeId,
                status: 'ACTIVE',
                startsAt: { lte: now },
                endsAt: { gte: now },
            },
            include: { commissionRules: { where: { isActive: true }, take: 1 } },
        });
        const rule = campaign?.commissionRules[0];
        if (!rule)
            return null;
        return {
            commissionPercent: (0, settlement_utils_1.decimalToNumber)(rule.commissionPercent),
            settlementDelayDays: rule.settlementDelayDays,
            commissionRuleId: rule.id,
            ruleScope: 'CAMPAIGN',
        };
    }
    async merchantProfileIdForStore(storeId) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { merchantProfileId: true },
        });
        return store?.merchantProfileId ?? '';
    }
    async resolveDominantCategoryId(orderId) {
        const items = await this.prisma.orderItem.findMany({
            where: { orderId },
            select: { totalPrice: true, product: { select: { categoryId: true } } },
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
exports.FinanceCommissionService = FinanceCommissionService;
exports.FinanceCommissionService = FinanceCommissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settlement_commission_service_1.SettlementCommissionService])
], FinanceCommissionService);
//# sourceMappingURL=finance-commission.service.js.map