import { PrismaService } from '../../database/prisma.service';
import { ReferralFraudDetectorService } from './referral-fraud-detector.service';
import { WalletFraudDetectorService } from './wallet-fraud-detector.service';
import { CouponFraudDetectorService } from './coupon-fraud-detector.service';
import { CodFraudDetectorService } from './cod-fraud-detector.service';
import { RiderFraudDetectorService } from './rider-fraud-detector.service';
import { MerchantFraudDetectorService } from './merchant-fraud-detector.service';
import { AccountSecurityService } from './account-security.service';
import { RiskEngineService } from './risk-engine.service';
import type { DeviceContext } from './device-fingerprint.service';
export declare class TrustSafetyHookService {
    private readonly prisma;
    private readonly referral;
    private readonly wallet;
    private readonly coupon;
    private readonly cod;
    private readonly rider;
    private readonly merchant;
    private readonly account;
    private readonly risk;
    private readonly logger;
    constructor(prisma: PrismaService, referral: ReferralFraudDetectorService, wallet: WalletFraudDetectorService, coupon: CouponFraudDetectorService, cod: CodFraudDetectorService, rider: RiderFraudDetectorService, merchant: MerchantFraudDetectorService, account: AccountSecurityService, risk: RiskEngineService);
    beforeReferralApply(ctx: Parameters<ReferralFraudDetectorService['evaluate']>[0]): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    beforeCodCheckout(userId: string): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    beforeCouponApply(userId: string, couponId: string, ctx: DeviceContext): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    onOrderDelivered(orderId: string, riderProfileId: string, lat?: number, lng?: number): Promise<void>;
    onWalletCredit(walletId: string, amount: number, referenceId?: string): Promise<void>;
    onOtpRequest(phone: string, ip?: string, deviceId?: string, userAgent?: string): Promise<void>;
    onOtpVerified(userId: string, ctx: DeviceContext): Promise<void>;
    recalculateUser(userId: string): Promise<import("./risk-engine.service").RiskScores>;
}
