import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';
export declare class CodFraudDetectorService {
    private readonly prisma;
    private readonly risk;
    private readonly cases;
    private readonly actions;
    private readonly alerts;
    constructor(prisma: PrismaService, risk: RiskEngineService, cases: FraudCaseService, actions: FraudActionService, alerts: TrustAlertService);
    evaluateCodCheckout(userId: string): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    updateBuyerCodMetrics(userId: string): Promise<void>;
}
