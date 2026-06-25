import { Module } from '@nestjs/common';
import { RiskEngineService } from './risk-engine.service';
import { DeviceFingerprintService } from './device-fingerprint.service';
import { FraudCaseService } from './fraud-case.service';
import { FraudActionService } from './fraud-action.service';
import { TrustAlertService } from './trust-alert.service';
import { ReferralFraudDetectorService } from './referral-fraud-detector.service';
import { WalletFraudDetectorService } from './wallet-fraud-detector.service';
import { CouponFraudDetectorService } from './coupon-fraud-detector.service';
import { CodFraudDetectorService } from './cod-fraud-detector.service';
import { RiderFraudDetectorService } from './rider-fraud-detector.service';
import { MerchantFraudDetectorService } from './merchant-fraud-detector.service';
import { AccountSecurityService } from './account-security.service';
import { TrustSafetyHookService } from './trust-safety-hook.service';
import { TrustSafetyService } from './trust-safety.service';
import { AdminTrustSafetyController } from './admin-trust-safety.controller';

@Module({
  controllers: [AdminTrustSafetyController],
  providers: [
    RiskEngineService,
    DeviceFingerprintService,
    FraudCaseService,
    FraudActionService,
    TrustAlertService,
    ReferralFraudDetectorService,
    WalletFraudDetectorService,
    CouponFraudDetectorService,
    CodFraudDetectorService,
    RiderFraudDetectorService,
    MerchantFraudDetectorService,
    AccountSecurityService,
    TrustSafetyHookService,
    TrustSafetyService,
  ],
  exports: [TrustSafetyHookService, RiskEngineService, TrustAlertService, TrustSafetyService, FraudCaseService],
})
export class TrustSafetyModule {}
