"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutModule = void 0;
const common_1 = require("@nestjs/common");
const checkout_service_1 = require("./checkout.service");
const reservation_service_1 = require("./reservation.service");
const checkout_controller_1 = require("./checkout.controller");
const idempotency_middleware_1 = require("./idempotency.middleware");
const cart_module_1 = require("../cart/cart.module");
const inventory_module_1 = require("../inventory/inventory.module");
const promotion_module_1 = require("../promotion/promotion.module");
const geospatial_module_1 = require("../geospatial/geospatial.module");
const wallet_loyalty_module_1 = require("../wallet-loyalty/wallet-loyalty.module");
const finance_module_1 = require("../finance/finance.module");
const trust_safety_module_1 = require("../trust-safety/trust-safety.module");
const fulfillment_network_module_1 = require("../fulfillment-network/fulfillment-network.module");
const corporate_module_1 = require("../corporate/corporate.module");
const location_directory_module_1 = require("../location-directory/location-directory.module");
const push_module_1 = require("../push/push.module");
const logistics_module_1 = require("../logistics/logistics.module");
let CheckoutModule = class CheckoutModule {
    configure(consumer) {
        consumer
            .apply(idempotency_middleware_1.IdempotencyMiddleware)
            .forRoutes({ path: 'buyer/checkout', method: common_1.RequestMethod.POST }, { path: 'buyer/checkout/cod', method: common_1.RequestMethod.POST }, { path: 'buyer/food-checkout', method: common_1.RequestMethod.POST }, { path: 'buyer/food-checkout/cod', method: common_1.RequestMethod.POST }, { path: 'buyer/food-checkout/razorpay/create-order/:checkoutId', method: common_1.RequestMethod.POST }, { path: 'buyer/food-checkout/razorpay/verify', method: common_1.RequestMethod.POST }, { path: 'buyer/food-checkout/razorpay/sync/:checkoutId', method: common_1.RequestMethod.POST });
    }
};
exports.CheckoutModule = CheckoutModule;
exports.CheckoutModule = CheckoutModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cart_module_1.CartModule,
            inventory_module_1.InventoryModule,
            promotion_module_1.PromotionModule,
            geospatial_module_1.GeospatialModule,
            wallet_loyalty_module_1.WalletLoyaltyModule,
            finance_module_1.FinanceModule,
            trust_safety_module_1.TrustSafetyModule,
            fulfillment_network_module_1.FulfillmentNetworkModule,
            corporate_module_1.CorporateModule,
            location_directory_module_1.LocationDirectoryModule,
            push_module_1.PushModule,
            (0, common_1.forwardRef)(() => logistics_module_1.LogisticsModule),
        ],
        controllers: [checkout_controller_1.CheckoutController],
        providers: [checkout_service_1.CheckoutService, reservation_service_1.ReservationService],
        exports: [checkout_service_1.CheckoutService, reservation_service_1.ReservationService],
    })
], CheckoutModule);
//# sourceMappingURL=checkout.module.js.map