"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletLoyaltyModule = void 0;
const common_1 = require("@nestjs/common");
const buyer_wallet_controller_1 = require("./buyer-wallet.controller");
const admin_rewards_controller_1 = require("./admin-rewards.controller");
const merchant_loyalty_controller_1 = require("./merchant-loyalty.controller");
const wallet_service_1 = require("./wallet.service");
const reward_service_1 = require("./reward.service");
const referral_service_1 = require("./referral.service");
const fraud_service_1 = require("./fraud.service");
const reward_config_service_1 = require("./reward-config.service");
const trust_safety_module_1 = require("../trust-safety/trust-safety.module");
const membership_module_1 = require("../membership/membership.module");
const wallet_loyalty_checkout_service_1 = require("./wallet-loyalty-checkout.service");
let WalletLoyaltyModule = class WalletLoyaltyModule {
};
exports.WalletLoyaltyModule = WalletLoyaltyModule;
exports.WalletLoyaltyModule = WalletLoyaltyModule = __decorate([
    (0, common_1.Module)({
        imports: [trust_safety_module_1.TrustSafetyModule, membership_module_1.MembershipModule],
        controllers: [buyer_wallet_controller_1.BuyerWalletController, admin_rewards_controller_1.AdminRewardsController, merchant_loyalty_controller_1.MerchantLoyaltyController],
        providers: [
            wallet_service_1.WalletService,
            reward_service_1.RewardService,
            referral_service_1.ReferralService,
            fraud_service_1.FraudService,
            reward_config_service_1.RewardConfigService,
            wallet_loyalty_checkout_service_1.WalletLoyaltyCheckoutService,
        ],
        exports: [
            wallet_service_1.WalletService,
            reward_service_1.RewardService,
            referral_service_1.ReferralService,
            wallet_loyalty_checkout_service_1.WalletLoyaltyCheckoutService,
        ],
    })
], WalletLoyaltyModule);
//# sourceMappingURL=wallet-loyalty.module.js.map