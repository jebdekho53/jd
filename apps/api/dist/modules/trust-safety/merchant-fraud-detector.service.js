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
exports.MerchantFraudDetectorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fraud_action_service_1 = require("./fraud-action.service");
const fraud_case_service_1 = require("./fraud-case.service");
const risk_engine_service_1 = require("./risk-engine.service");
const trust_alert_service_1 = require("./trust-alert.service");
let MerchantFraudDetectorService = class MerchantFraudDetectorService {
    constructor(prisma, risk, cases, actions, alerts) {
        this.prisma = prisma;
        this.risk = risk;
        this.cases = cases;
        this.actions = actions;
        this.alerts = alerts;
    }
    async evaluateOrderPattern(storeId, merchantUserId) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [orders, reviews] = await Promise.all([
            this.prisma.order.count({ where: { storeId, createdAt: { gte: dayAgo } } }),
            this.prisma.review.count({
                where: { storeId, createdAt: { gte: dayAgo }, rating: 5 },
            }),
        ]);
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { createdAt: true },
        });
        const storeAgeDays = store
            ? (Date.now() - store.createdAt.getTime()) / (24 * 60 * 60 * 1000)
            : 999;
        if (storeAgeDays < 7 && orders > 100) {
            await this.flag(merchantUserId, storeId, 'MERCHANT_ORDER_INFLATION', `${orders} orders in 7 days`);
        }
        if (reviews > 20 && orders < 10) {
            await this.flag(merchantUserId, storeId, 'REVIEW_FARM', `${reviews} 5-star reviews vs ${orders} orders`);
        }
    }
    async flag(userId, storeId, rule, detail) {
        const key = `merchant:${rule}:${storeId}`;
        await this.risk.recordEvent({
            userId,
            eventType: rule,
            severity: 'HIGH',
            idempotencyKey: key,
            metadata: { storeId, detail },
        });
        const fraudCase = await this.cases.openCase({
            userId,
            category: client_1.FraudCaseCategory.MERCHANT_FRAUD,
            severity: 'HIGH',
            title: 'Merchant fraud signal',
            description: `${rule}: ${detail}`,
            subjectType: 'store',
            subjectId: storeId,
            idempotencyKey: key,
        });
        await this.actions.apply(userId, client_1.FraudDecisionAction.MERCHANT_SUSPEND, rule, undefined, `${key}:action`);
        await this.alerts.raise(client_1.TrustAlertType.MERCHANT_ANOMALY, 'HIGH', 'Merchant fraud detected', fraudCase.description, { caseId: fraudCase.id });
    }
};
exports.MerchantFraudDetectorService = MerchantFraudDetectorService;
exports.MerchantFraudDetectorService = MerchantFraudDetectorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        risk_engine_service_1.RiskEngineService,
        fraud_case_service_1.FraudCaseService,
        fraud_action_service_1.FraudActionService,
        trust_alert_service_1.TrustAlertService])
], MerchantFraudDetectorService);
//# sourceMappingURL=merchant-fraud-detector.service.js.map