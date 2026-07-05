"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodModule = void 0;
const common_1 = require("@nestjs/common");
const food_cart_service_1 = require("./food-cart.service");
const food_cart_controller_1 = require("./food-cart.controller");
const food_checkout_service_1 = require("./food-checkout.service");
const food_checkout_controller_1 = require("./food-checkout.controller");
const food_payment_service_1 = require("./food-payment.service");
const food_payment_controller_1 = require("./food-payment.controller");
const menu_service_1 = require("./menu.service");
const food_order_service_1 = require("./food-order.service");
const restaurant_discovery_service_1 = require("./restaurant-discovery.service");
const menu_ocr_service_1 = require("./menu-ocr.service");
const buyer_restaurant_controller_1 = require("./buyer-restaurant.controller");
const merchant_restaurant_controller_1 = require("./merchant-restaurant.controller");
const admin_restaurant_controller_1 = require("./admin-restaurant.controller");
const geospatial_module_1 = require("../geospatial/geospatial.module");
const logistics_module_1 = require("../logistics/logistics.module");
const order_timeline_module_1 = require("../order/order-timeline.module");
const merchant_module_1 = require("../merchant/merchant.module");
const product_module_1 = require("../product/product.module");
const payment_module_1 = require("../payment/payment.module");
const push_module_1 = require("../push/push.module");
const email_module_1 = require("../email/email.module");
const buyer_module_1 = require("../buyer/buyer.module");
const category_governance_module_1 = require("../category-governance/category-governance.module");
const store_vertical_module_1 = require("../store-vertical/store-vertical.module");
const finance_module_1 = require("../finance/finance.module");
let FoodModule = class FoodModule {
};
exports.FoodModule = FoodModule;
exports.FoodModule = FoodModule = __decorate([
    (0, common_1.Module)({
        imports: [
            geospatial_module_1.GeospatialModule,
            logistics_module_1.LogisticsModule,
            order_timeline_module_1.OrderTimelineModule,
            merchant_module_1.MerchantModule,
            buyer_module_1.BuyerModule,
            category_governance_module_1.CategoryGovernanceModule,
            store_vertical_module_1.StoreVerticalModule,
            (0, common_1.forwardRef)(() => product_module_1.ProductModule),
            push_module_1.PushModule,
            email_module_1.EmailModule,
            (0, common_1.forwardRef)(() => payment_module_1.PaymentModule),
            (0, common_1.forwardRef)(() => finance_module_1.FinanceModule),
        ],
        controllers: [
            food_cart_controller_1.FoodCartController,
            food_checkout_controller_1.FoodCheckoutController,
            food_payment_controller_1.FoodPaymentController,
            buyer_restaurant_controller_1.BuyerRestaurantController,
            merchant_restaurant_controller_1.MerchantRestaurantController,
            merchant_restaurant_controller_1.MerchantFoodOrderController,
            admin_restaurant_controller_1.AdminRestaurantController,
        ],
        providers: [
            food_cart_service_1.FoodCartService,
            food_checkout_service_1.FoodCheckoutService,
            food_payment_service_1.FoodPaymentService,
            menu_service_1.MenuService,
            food_order_service_1.FoodOrderService,
            restaurant_discovery_service_1.RestaurantDiscoveryService,
            menu_ocr_service_1.MenuOcrService,
        ],
        exports: [
            store_vertical_module_1.StoreVerticalModule,
            food_cart_service_1.FoodCartService,
            food_payment_service_1.FoodPaymentService,
            menu_service_1.MenuService,
            restaurant_discovery_service_1.RestaurantDiscoveryService,
        ],
    })
], FoodModule);
//# sourceMappingURL=food.module.js.map