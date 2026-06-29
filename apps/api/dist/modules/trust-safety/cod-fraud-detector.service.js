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
exports.CodFraudDetectorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fraud_action_service_1 = require("./fraud-action.service");
const fraud_case_service_1 = require("./fraud-case.service");
const risk_engine_service_1 = require("./risk-engine.service");
const trust_alert_service_1 = require("./trust-alert.service");
let CodFraudDetectorService = class CodFraudDetectorService {
    constructor(prisma, risk, cases, actions, alerts) {
        this.prisma = prisma;
        this.risk = risk;
        this.cases = cases;
        this.actions = actions;
        this.alerts = alerts;
    }
    async evaluateCodCheckout(userId) {
        const allowed = await this.risk.canUseCod(userId);
        if (!allowed) {
            return { allowed: false, reason: 'COD is not available for your account. Please use online payment.' };
        }
        return { allowed: true };
    }
    async updateBuyerCodMetrics(userId) {
        const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!buyer)
            return;
        const codOrders = await this.prisma.order.findMany({
            where: {
                buyerProfileId: buyer.id,
                paymentMethod: { in: [client_1.PaymentMethod.COD, client_1.PaymentMethod.WALLET_COD] },
            },
            select: { status: true },
        });
        if (codOrders.length < 3)
            return;
        const total = codOrders.length;
        const cancelled = codOrders.filter((o) => ['CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT', 'CANCELLED_BY_ADMIN'].includes(o.status)).length;
        const refused = codOrders.filter((o) => o.status === client_1.OrderStatus.REFUNDED).length;
        const delivered = codOrders.filter((o) => [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED].includes(o.status)).length;
        const cancelRate = cancelled / total;
        const refusalRate = refused / total;
        const acceptanceRate = delivered / total;
        if (cancelRate > 0.4 || refusalRate > 0.3 || acceptanceRate < 0.5) {
            const key = `cod-abuse:${userId}`;
            await this.risk.recordEvent({
                userId,
                eventType: 'COD_ABUSE_PATTERN',
                severity: 'HIGH',
                idempotencyKey: key,
                metadata: { cancelRate, refusalRate, acceptanceRate, total },
            });
            const fraudCase = await this.cases.openCase({
                userId,
                category: client_1.FraudCaseCategory.COD_ABUSE,
                severity: 'HIGH',
                title: 'COD abuse pattern',
                description: `Cancel ${(cancelRate * 100).toFixed(0)}%, refusal ${(refusalRate * 100).toFixed(0)}%`,
                idempotencyKey: key,
            });
            await this.actions.apply(userId, client_1.FraudDecisionAction.COD_DISABLE, 'COD abuse', undefined, `${key}:action`);
            await this.alerts.raise(client_1.TrustAlertType.COD_ABUSE, 'HIGH', 'COD disabled for buyer', fraudCase.description, { userId, caseId: fraudCase.id });
        }
    }
};
exports.CodFraudDetectorService = CodFraudDetectorService;
exports.CodFraudDetectorService = CodFraudDetectorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        risk_engine_service_1.RiskEngineService,
        fraud_case_service_1.FraudCaseService,
        fraud_action_service_1.FraudActionService,
        trust_alert_service_1.TrustAlertService])
], CodFraudDetectorService);
//# sourceMappingURL=cod-fraud-detector.service.js.map