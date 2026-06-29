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
var WalletFraudDetectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletFraudDetectorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fraud_action_service_1 = require("./fraud-action.service");
const fraud_case_service_1 = require("./fraud-case.service");
const risk_engine_service_1 = require("./risk-engine.service");
const trust_alert_service_1 = require("./trust-alert.service");
let WalletFraudDetectorService = WalletFraudDetectorService_1 = class WalletFraudDetectorService {
    constructor(prisma, risk, cases, actions, alerts) {
        this.prisma = prisma;
        this.risk = risk;
        this.cases = cases;
        this.actions = actions;
        this.alerts = alerts;
        this.logger = new common_1.Logger(WalletFraudDetectorService_1.name);
    }
    async onWalletCredit(walletId, amount, referenceId) {
        const wallet = await this.prisma.buyerWallet.findUnique({
            where: { id: walletId },
            include: { buyerProfile: { select: { userId: true } } },
        });
        if (!wallet)
            return;
        const userId = wallet.buyerProfile.userId;
        const key = `wallet-credit:${walletId}:${referenceId ?? amount}`;
        if (amount >= 500) {
            await this.risk.recordEvent({
                userId,
                eventType: 'SUSPICIOUS_WALLET_CREDIT',
                severity: amount >= 2000 ? 'CRITICAL' : 'HIGH',
                idempotencyKey: key,
                metadata: { amount, walletId },
            });
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentCredits = await this.prisma.walletTransaction.count({
                where: { walletId, type: 'REWARD_CREDIT', createdAt: { gte: hourAgo } },
            });
            if (recentCredits >= 5) {
                await this.flagFarming(userId, walletId, recentCredits);
            }
        }
        const profile = await this.risk.getOrCreateProfile(userId);
        if (profile.walletFrozen) {
            this.logger.warn({ walletId, userId }, 'Wallet credit on frozen wallet');
        }
    }
    async onWalletCreated(userId) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const wallets = await this.prisma.buyerWallet.count({
            where: { buyerProfile: { user: { createdAt: { gte: dayAgo } } } },
        });
        if (wallets > 50) {
            await this.alerts.raise(client_1.TrustAlertType.WALLET_ABUSE, 'HIGH', 'Rapid wallet creation', 'Unusual volume of new wallets in 24h.', { count: wallets });
        }
    }
    async flagFarming(userId, walletId, count) {
        const key = `wallet-farming:${walletId}`;
        const fraudCase = await this.cases.openCase({
            userId,
            category: client_1.FraudCaseCategory.WALLET_ABUSE,
            severity: 'HIGH',
            title: 'Wallet farming suspected',
            description: `${count} credits in 1 hour`,
            subjectType: 'wallet',
            subjectId: walletId,
            idempotencyKey: key,
        });
        await this.actions.apply(userId, client_1.FraudDecisionAction.WALLET_FREEZE, 'Wallet farming', undefined, key);
        await this.alerts.raise(client_1.TrustAlertType.WALLET_ABUSE, 'HIGH', 'Wallet abuse detected', fraudCase.description, { caseId: fraudCase.id });
    }
};
exports.WalletFraudDetectorService = WalletFraudDetectorService;
exports.WalletFraudDetectorService = WalletFraudDetectorService = WalletFraudDetectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        risk_engine_service_1.RiskEngineService,
        fraud_case_service_1.FraudCaseService,
        fraud_action_service_1.FraudActionService,
        trust_alert_service_1.TrustAlertService])
], WalletFraudDetectorService);
//# sourceMappingURL=wallet-fraud-detector.service.js.map