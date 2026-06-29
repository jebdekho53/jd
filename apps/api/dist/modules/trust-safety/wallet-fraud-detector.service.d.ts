import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';
export declare class WalletFraudDetectorService {
    private readonly prisma;
    private readonly risk;
    private readonly cases;
    private readonly actions;
    private readonly alerts;
    private readonly logger;
    constructor(prisma: PrismaService, risk: RiskEngineService, cases: FraudCaseService, actions: FraudActionService, alerts: TrustAlertService);
    onWalletCredit(walletId: string, amount: number, referenceId?: string): Promise<void>;
    onWalletCreated(userId: string): Promise<void>;
    private flagFarming;
}
