"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderModule = void 0;
const common_1 = require("@nestjs/common");
const rider_assignment_module_1 = require("../rider-assignment/rider-assignment.module");
const delivery_tracking_module_1 = require("../delivery-tracking/delivery-tracking.module");
const delivery_service_1 = require("./delivery.service");
const rider_location_service_1 = require("./rider-location.service");
const rider_controller_1 = require("./rider.controller");
const admin_rider_controller_1 = require("./admin-rider.controller");
const order_fulfillment_module_1 = require("../order/order-fulfillment.module");
const checkout_module_1 = require("../checkout/checkout.module");
const order_timeline_module_1 = require("../order/order-timeline.module");
const finance_module_1 = require("../finance/finance.module");
const push_module_1 = require("../push/push.module");
let RiderModule = class RiderModule {
};
exports.RiderModule = RiderModule;
exports.RiderModule = RiderModule = __decorate([
    (0, common_1.Module)({
        imports: [rider_assignment_module_1.RiderAssignmentModule, delivery_tracking_module_1.DeliveryTrackingModule, order_fulfillment_module_1.OrderFulfillmentModule, finance_module_1.FinanceModule, checkout_module_1.CheckoutModule, order_timeline_module_1.OrderTimelineModule, push_module_1.PushModule],
        controllers: [rider_controller_1.RiderController, admin_rider_controller_1.AdminRiderController],
        providers: [delivery_service_1.DeliveryService, rider_location_service_1.RiderLocationService],
        exports: [delivery_service_1.DeliveryService, rider_assignment_module_1.RiderAssignmentModule],
    })
], RiderModule);
//# sourceMappingURL=rider.module.js.map