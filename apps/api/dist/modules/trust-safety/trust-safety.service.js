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
exports.TrustSafetyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fraud_action_service_1 = require("./fraud-action.service");
const fraud_case_service_1 = require("./fraud-case.service");
const risk_engine_service_1 = require("./risk-engine.service");
const trust_alert_service_1 = require("./trust-alert.service");
let TrustSafetyService = class TrustSafetyService {
    constructor(prisma, cases, actions, risk, alerts) {
        this.prisma = prisma;
        this.cases = cases;
        this.actions = actions;
        this.risk = risk;
        this.alerts = alerts;
    }
    async getDashboard() {
        const [openCases, blockedProfiles, trustAlerts, preventedWallet, preventedReferral, restrictions,] = await Promise.all([
            this.prisma.fraudCase.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
            this.prisma.riskProfile.count({ where: { status: client_1.RiskProfileStatus.BLOCKED } }),
            this.alerts.listOpen(20),
            this.prisma.fraudCase.count({ where: { category: 'WALLET_ABUSE', status: 'RESOLVED' } }),
            this.prisma.fraudCase.count({ where: { category: 'REFERRAL_ABUSE', status: 'RESOLVED' } }),
            this.prisma.accountRestriction.count({ where: { active: true } }),
        ]);
        const codDisabled = await this.prisma.buyerProfile.count({ where: { codEnabled: false } });
        const merchantsBlocked = await this.prisma.merchantProfile.count({ where: { isBlacklisted: true } });
        return {
            metrics: {
                openCases,
                blockedUsers: blockedProfiles,
                blockedMerchants: merchantsBlocked,
                activeRestrictions: restrictions,
                fraudPrevented: openCases + preventedWallet + preventedReferral,
                walletAbusePrevented: preventedWallet,
                referralAbusePrevented: preventedReferral,
                codLossAvoided: codDisabled,
            },
            alerts: trustAlerts,
        };
    }
    async listRiskProfiles(page = 1, limit = 20, status) {
        const where = status ? { status } : {};
        const [items, total] = await Promise.all([
            this.prisma.riskProfile.findMany({
                where,
                orderBy: { riskScore: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.riskProfile.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async listCases(category, page = 1, limit = 20) {
        return this.cases.listCases(category, client_1.FraudCaseStatus.OPEN, page, limit);
    }
    async listBlockedAccounts(page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.accountRestriction.findMany({
                where: { active: true },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.accountRestriction.count({ where: { active: true } }),
        ]);
        return { items, total, page, limit };
    }
    async adminAction(adminUserId, action, userId, reason, caseId) {
        const actionMap = {
            approve: null,
            reject: null,
            warn: client_1.FraudDecisionAction.WARN,
            restrict: client_1.FraudDecisionAction.RESTRICT,
            suspend: client_1.FraudDecisionAction.HARD_BLOCK,
            blacklist: client_1.FraudDecisionAction.BLACKLIST,
        };
        if (caseId && (action === 'approve' || action === 'reject')) {
            await this.cases.resolveCase(caseId, adminUserId, reason, action === 'reject');
            if (action === 'approve' && userId) {
                await this.risk.recalculate(userId);
            }
            return { success: true };
        }
        const fraudAction = actionMap[action];
        if (fraudAction) {
            await this.actions.apply(userId, fraudAction, reason, adminUserId);
        }
        await this.risk.recalculate(userId);
        return { success: true };
    }
    async enableCodForBuyer(userId, adminUserId) {
        await this.prisma.buyerProfile.updateMany({ where: { userId }, data: { codEnabled: true } });
        await this.prisma.riskProfile.updateMany({ where: { userId }, data: { codEnabled: true } });
        const restrictions = await this.prisma.accountRestriction.findMany({
            where: { userId, active: true, restrictionType: 'COD_DISABLE' },
        });
        for (const r of restrictions) {
            await this.actions.liftRestriction(r.id, adminUserId);
        }
        return { success: true };
    }
};
exports.TrustSafetyService = TrustSafetyService;
exports.TrustSafetyService = TrustSafetyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fraud_case_service_1.FraudCaseService,
        fraud_action_service_1.FraudActionService,
        risk_engine_service_1.RiskEngineService,
        trust_alert_service_1.TrustAlertService])
], TrustSafetyService);
//# sourceMappingURL=trust-safety.service.js.map