"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustSafetyModule = void 0;
const common_1 = require("@nestjs/common");
const risk_engine_service_1 = require("./risk-engine.service");
const device_fingerprint_service_1 = require("./device-fingerprint.service");
const fraud_case_service_1 = require("./fraud-case.service");
const fraud_action_service_1 = require("./fraud-action.service");
const trust_alert_service_1 = require("./trust-alert.service");
const referral_fraud_detector_service_1 = require("./referral-fraud-detector.service");
const wallet_fraud_detector_service_1 = require("./wallet-fraud-detector.service");
const coupon_fraud_detector_service_1 = require("./coupon-fraud-detector.service");
const cod_fraud_detector_service_1 = require("./cod-fraud-detector.service");
const rider_fraud_detector_service_1 = require("./rider-fraud-detector.service");
const merchant_fraud_detector_service_1 = require("./merchant-fraud-detector.service");
const account_security_service_1 = require("./account-security.service");
const trust_safety_hook_service_1 = require("./trust-safety-hook.service");
const trust_safety_service_1 = require("./trust-safety.service");
const admin_trust_safety_controller_1 = require("./admin-trust-safety.controller");
let TrustSafetyModule = class TrustSafetyModule {
};
exports.TrustSafetyModule = TrustSafetyModule;
exports.TrustSafetyModule = TrustSafetyModule = __decorate([
    (0, common_1.Module)({
        controllers: [admin_trust_safety_controller_1.AdminTrustSafetyController],
        providers: [
            risk_engine_service_1.RiskEngineService,
            device_fingerprint_service_1.DeviceFingerprintService,
            fraud_case_service_1.FraudCaseService,
            fraud_action_service_1.FraudActionService,
            trust_alert_service_1.TrustAlertService,
            referral_fraud_detector_service_1.ReferralFraudDetectorService,
            wallet_fraud_detector_service_1.WalletFraudDetectorService,
            coupon_fraud_detector_service_1.CouponFraudDetectorService,
            cod_fraud_detector_service_1.CodFraudDetectorService,
            rider_fraud_detector_service_1.RiderFraudDetectorService,
            merchant_fraud_detector_service_1.MerchantFraudDetectorService,
            account_security_service_1.AccountSecurityService,
            trust_safety_hook_service_1.TrustSafetyHookService,
            trust_safety_service_1.TrustSafetyService,
        ],
        exports: [trust_safety_hook_service_1.TrustSafetyHookService, risk_engine_service_1.RiskEngineService, trust_alert_service_1.TrustAlertService, trust_safety_service_1.TrustSafetyService, fraud_case_service_1.FraudCaseService],
    })
], TrustSafetyModule);
//# sourceMappingURL=trust-safety.module.js.map