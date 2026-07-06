import { PrismaService } from '../../database/prisma.service';
import { RiskEngineService } from './risk-engine.service';
export interface DeviceContext {
    deviceId?: string;
    fingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
    os?: string;
    city?: string;
    state?: string;
}
export declare class DeviceFingerprintService {
    private readonly prisma;
    private readonly risk;
    constructor(prisma: PrismaService, risk: RiskEngineService);
    track(userId: string | undefined, ctx: DeviceContext): Promise<any>;
    countAccountsOnDevice(fingerprint: string): Promise<number>;
    countReferralsOnDevice(fingerprint: string): Promise<number>;
}
