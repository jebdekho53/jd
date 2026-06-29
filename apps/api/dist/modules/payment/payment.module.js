"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const payment_controller_1 = require("./payment.controller");
const razorpay_service_1 = require("./razorpay.service");
const order_refund_service_1 = require("./order-refund.service");
const refund_retry_scheduler_1 = require("./refund-retry.scheduler");
const checkout_module_1 = require("../checkout/checkout.module");
const push_module_1 = require("../push/push.module");
const finance_module_1 = require("../finance/finance.module");
const compliance_module_1 = require("../compliance/compliance.module");
const wallet_loyalty_module_1 = require("../wallet-loyalty/wallet-loyalty.module");
const logistics_module_1 = require("../logistics/logistics.module");
const food_module_1 = require("../food/food.module");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            checkout_module_1.CheckoutModule,
            push_module_1.PushModule,
            finance_module_1.FinanceModule,
            compliance_module_1.ComplianceModule,
            wallet_loyalty_module_1.WalletLoyaltyModule,
            logistics_module_1.LogisticsModule,
            (0, common_1.forwardRef)(() => food_module_1.FoodModule),
        ],
        controllers: [payment_controller_1.PaymentController],
        providers: [payment_service_1.PaymentService, razorpay_service_1.RazorpayService, order_refund_service_1.OrderRefundService, refund_retry_scheduler_1.RefundRetryScheduler],
        exports: [payment_service_1.PaymentService, razorpay_service_1.RazorpayService, order_refund_service_1.OrderRefundService],
    })
], PaymentModule);
//# sourceMappingURL=payment.module.js.map