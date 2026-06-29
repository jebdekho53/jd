import { PrismaService } from '../../database/prisma.service';
import { DeviceFingerprintService, DeviceContext } from './device-fingerprint.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';
export declare class AccountSecurityService {
    private readonly prisma;
    private readonly devices;
    private readonly risk;
    private readonly alerts;
    constructor(prisma: PrismaService, devices: DeviceFingerprintService, risk: RiskEngineService, alerts: TrustAlertService);
    onOtpRequest(phone: string, ipAddress?: string, deviceId?: string, userAgent?: string): Promise<void>;
    onOtpVerified(userId: string, ctx: DeviceContext & {
        sessionToken?: string;
    }): Promise<void>;
    auditOtpRecord(otpId: string, ipAddress?: string, deviceId?: string, userAgent?: string): Promise<void>;
}
