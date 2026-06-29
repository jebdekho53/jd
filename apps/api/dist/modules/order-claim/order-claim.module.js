"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderClaimModule = void 0;
const common_1 = require("@nestjs/common");
const payment_module_1 = require("../payment/payment.module");
const finance_module_1 = require("../finance/finance.module");
const wallet_loyalty_module_1 = require("../wallet-loyalty/wallet-loyalty.module");
const compliance_module_1 = require("../compliance/compliance.module");
const logistics_module_1 = require("../logistics/logistics.module");
const merchant_module_1 = require("../merchant/merchant.module");
const claim_eligibility_service_1 = require("./claim-eligibility.service");
const claim_refund_service_1 = require("./claim-refund.service");
const claim_replacement_service_1 = require("./claim-replacement.service");
const claim_notification_service_1 = require("./claim-notification.service");
const order_claim_service_1 = require("./order-claim.service");
const buyer_order_claim_controller_1 = require("./buyer-order-claim.controller");
const merchant_claim_controller_1 = require("./merchant-claim.controller");
const admin_claim_controller_1 = require("./admin-claim.controller");
let OrderClaimModule = class OrderClaimModule {
};
exports.OrderClaimModule = OrderClaimModule;
exports.OrderClaimModule = OrderClaimModule = __decorate([
    (0, common_1.Module)({
        imports: [
            payment_module_1.PaymentModule,
            finance_module_1.FinanceModule,
            wallet_loyalty_module_1.WalletLoyaltyModule,
            compliance_module_1.ComplianceModule,
            logistics_module_1.LogisticsModule,
            merchant_module_1.MerchantModule,
        ],
        controllers: [
            buyer_order_claim_controller_1.BuyerOrderClaimController,
            merchant_claim_controller_1.MerchantClaimController,
            admin_claim_controller_1.AdminClaimController,
        ],
        providers: [
            claim_eligibility_service_1.ClaimEligibilityService,
            claim_refund_service_1.ClaimRefundService,
            claim_replacement_service_1.ClaimReplacementService,
            claim_notification_service_1.ClaimNotificationService,
            order_claim_service_1.OrderClaimService,
        ],
        exports: [order_claim_service_1.OrderClaimService, claim_eligibility_service_1.ClaimEligibilityService],
    })
], OrderClaimModule);
//# sourceMappingURL=order-claim.module.js.map