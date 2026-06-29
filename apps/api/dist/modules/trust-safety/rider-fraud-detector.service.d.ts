import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';
export declare class RiderFraudDetectorService {
    private readonly prisma;
    private readonly risk;
    private readonly cases;
    private readonly actions;
    private readonly alerts;
    constructor(prisma: PrismaService, risk: RiskEngineService, cases: FraudCaseService, actions: FraudActionService, alerts: TrustAlertService);
    evaluateDeliveryCompletion(orderId: string, riderProfileId: string, lat?: number, lng?: number): Promise<void>;
    private haversineSpeedKmh;
    private flagGpsSpoof;
    private flagCodMismatch;
}
