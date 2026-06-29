"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModule = void 0;
const common_1 = require("@nestjs/common");
const rider_assignment_module_1 = require("../rider-assignment/rider-assignment.module");
const logistics_module_1 = require("../logistics/logistics.module");
const checkout_module_1 = require("../checkout/checkout.module");
const inventory_module_1 = require("../inventory/inventory.module");
const wallet_loyalty_module_1 = require("../wallet-loyalty/wallet-loyalty.module");
const finance_module_1 = require("../finance/finance.module");
const compliance_module_1 = require("../compliance/compliance.module");
const push_module_1 = require("../push/push.module");
const payment_module_1 = require("../payment/payment.module");
const delivery_tracking_module_1 = require("../delivery-tracking/delivery-tracking.module");
const order_service_1 = require("./order.service");
const buyer_order_controller_1 = require("./buyer-order.controller");
const merchant_order_controller_1 = require("./merchant-order.controller");
const admin_order_controller_1 = require("./admin-order.controller");
let OrderModule = class OrderModule {
};
exports.OrderModule = OrderModule;
exports.OrderModule = OrderModule = __decorate([
    (0, common_1.Module)({
        imports: [rider_assignment_module_1.RiderAssignmentModule, logistics_module_1.LogisticsModule, checkout_module_1.CheckoutModule, inventory_module_1.InventoryModule, wallet_loyalty_module_1.WalletLoyaltyModule, finance_module_1.FinanceModule, compliance_module_1.ComplianceModule, push_module_1.PushModule, payment_module_1.PaymentModule, delivery_tracking_module_1.DeliveryTrackingModule],
        controllers: [buyer_order_controller_1.BuyerOrderController, merchant_order_controller_1.MerchantOrderController, admin_order_controller_1.AdminOrderController],
        providers: [order_service_1.OrderService],
        exports: [order_service_1.OrderService],
    })
], OrderModule);
//# sourceMappingURL=order.module.js.map