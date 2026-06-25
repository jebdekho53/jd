import { Injectable } from '@nestjs/common';
import { FraudDecisionAction, FraudCaseCategory, FraudCaseStatus, RiskProfileStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';

@Injectable()
export class TrustSafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cases: FraudCaseService,
    private readonly actions: FraudActionService,
    private readonly risk: RiskEngineService,
    private readonly alerts: TrustAlertService,
  ) {}

  async getDashboard() {
    const [
      openCases,
      blockedProfiles,
      trustAlerts,
      preventedWallet,
      preventedReferral,
      restrictions,
    ] = await Promise.all([
      this.prisma.fraudCase.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      this.prisma.riskProfile.count({ where: { status: RiskProfileStatus.BLOCKED } }),
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

  async listRiskProfiles(page = 1, limit = 20, status?: RiskProfileStatus) {
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

  async listCases(category?: FraudCaseCategory, page = 1, limit = 20) {
    return this.cases.listCases(category, FraudCaseStatus.OPEN, page, limit);
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

  async adminAction(
    adminUserId: string,
    action: 'approve' | 'reject' | 'warn' | 'restrict' | 'suspend' | 'blacklist',
    userId: string,
    reason: string,
    caseId?: string,
  ) {
    const actionMap: Record<string, FraudDecisionAction | null> = {
      approve: null,
      reject: null,
      warn: FraudDecisionAction.WARN,
      restrict: FraudDecisionAction.RESTRICT,
      suspend: FraudDecisionAction.HARD_BLOCK,
      blacklist: FraudDecisionAction.BLACKLIST,
    };

    if (caseId && (action === 'approve' || action === 'reject')) {
      await this.cases.resolveCase(
        caseId,
        adminUserId,
        reason,
        action === 'reject',
      );
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

  async enableCodForBuyer(userId: string, adminUserId: string) {
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
}
