import { PrismaService } from '../../database/prisma.service';
import { DeviceFingerprintService } from './device-fingerprint.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import type { DeviceContext } from './device-fingerprint.service';
export declare class CouponFraudDetectorService {
    private readonly prisma;
    private readonly devices;
    private readonly risk;
    private readonly cases;
    private readonly actions;
    constructor(prisma: PrismaService, devices: DeviceFingerprintService, risk: RiskEngineService, cases: FraudCaseService, actions: FraudActionService);
    evaluateCouponRedemption(userId: string, couponId: string, ctx: DeviceContext & {
        deliveryAddress?: string;
    }): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    private flag;
}
