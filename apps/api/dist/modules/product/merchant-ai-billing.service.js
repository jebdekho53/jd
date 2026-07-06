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
var MerchantAiBillingService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantAiBillingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_ai_wallet_service_1 = require("./merchant-ai-wallet.service");
let MerchantAiBillingService = MerchantAiBillingService_1 = class MerchantAiBillingService {
    constructor(prisma, configService, wallet) {
        this.prisma = prisma;
        this.configService = configService;
        this.wallet = wallet;
        this.logger = new common_1.Logger(MerchantAiBillingService_1.name);
    }
    getPricePaise() {
        return this.wallet.getProductCostPaise();
    }
    getMinRechargePaise() {
        return this.wallet.getMinRechargePaise();
    }
    buildCreateProductIdempotencyKey(merchantProfileId, storeId, analysisId) {
        return this.wallet.buildDebitIdempotencyKey(merchantProfileId, storeId, analysisId);
    }
    async chargeForProductCreation(merchantProfileId, storeId, analysisId, userId, ipAddress) {
        return this.wallet.debitForProductCreation(merchantProfileId, storeId, analysisId, userId, ipAddress);
    }
    async refundOnProductCreationFailure(merchantProfileId, storeId, analysisId, reason, userId, ipAddress) {
        return this.wallet.refundOnProductCreationFailure(merchantProfileId, storeId, analysisId, reason, userId, ipAddress);
    }
    async assertDailyAnalysisLimit(merchantProfileId) {
        const limit = this.configService.get('AI_PRODUCT_ANALYSIS_DAILY_LIMIT', 20);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const count = await this.prisma.aIProductAnalysis.count({
            where: {
                merchantProfileId,
                createdAt: { gte: startOfDay },
                status: { notIn: ['CANCELLED'] },
            },
        });
        if (count >= limit) {
            throw new common_1.ConflictException(`Daily AI analysis limit reached (${limit} per day). Try again tomorrow.`);
        }
    }
};
exports.MerchantAiBillingService = MerchantAiBillingService;
exports.MerchantAiBillingService = MerchantAiBillingService = MerchantAiBillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, merchant_ai_wallet_service_1.MerchantAiWalletService])
], MerchantAiBillingService);
//# sourceMappingURL=merchant-ai-billing.service.js.map