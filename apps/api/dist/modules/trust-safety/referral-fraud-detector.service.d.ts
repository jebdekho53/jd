import { PrismaService } from '../../database/prisma.service';
import { DeviceFingerprintService } from './device-fingerprint.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';
import type { DeviceContext } from './device-fingerprint.service';
export interface ReferralCheckContext extends DeviceContext {
    buyerProfileId: string;
    referrerWalletId: string;
    referredWalletId: string;
    referralCode: string;
    deliveryAddress?: string;
    paymentMethod?: string;
    deliveryLat?: number;
    deliveryLng?: number;
}
export declare class ReferralFraudDetectorService {
    private readonly prisma;
    private readonly devices;
    private readonly cases;
    private readonly actions;
    private readonly risk;
    private readonly alerts;
    constructor(prisma: PrismaService, devices: DeviceFingerprintService, cases: FraudCaseService, actions: FraudActionService, risk: RiskEngineService, alerts: TrustAlertService);
    evaluate(ctx: ReferralCheckContext): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    private flag;
}
