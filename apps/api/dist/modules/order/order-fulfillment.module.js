"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderFulfillmentModule = void 0;
const common_1 = require("@nestjs/common");
const settlement_module_1 = require("../settlement/settlement.module");
const finance_module_1 = require("../finance/finance.module");
const checkout_module_1 = require("../checkout/checkout.module");
const compliance_module_1 = require("../compliance/compliance.module");
const trust_safety_module_1 = require("../trust-safety/trust-safety.module");
const wallet_loyalty_module_1 = require("../wallet-loyalty/wallet-loyalty.module");
const push_module_1 = require("../push/push.module");
const order_delivered_handler_service_1 = require("./order-delivered-handler.service");
let OrderFulfillmentModule = class OrderFulfillmentModule {
};
exports.OrderFulfillmentModule = OrderFulfillmentModule;
exports.OrderFulfillmentModule = OrderFulfillmentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => settlement_module_1.SettlementModule),
            (0, common_1.forwardRef)(() => finance_module_1.FinanceModule),
            (0, common_1.forwardRef)(() => checkout_module_1.CheckoutModule),
            compliance_module_1.ComplianceModule,
            trust_safety_module_1.TrustSafetyModule,
            wallet_loyalty_module_1.WalletLoyaltyModule,
            push_module_1.PushModule,
        ],
        providers: [order_delivered_handler_service_1.OrderDeliveredHandlerService],
        exports: [order_delivered_handler_service_1.OrderDeliveredHandlerService],
    })
], OrderFulfillmentModule);
//# sourceMappingURL=order-fulfillment.module.js.map