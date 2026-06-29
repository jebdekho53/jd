"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryTrackingModule = void 0;
const common_1 = require("@nestjs/common");
const order_timeline_module_1 = require("../order/order-timeline.module");
const websocket_module_1 = require("../../common/websocket/websocket.module");
const delivery_tracking_service_1 = require("./delivery-tracking.service");
const delivery_tracking_gateway_1 = require("./delivery-tracking.gateway");
const delivery_tracking_cache_service_1 = require("./delivery-tracking-cache.service");
const delivery_tracking_controller_1 = require("./delivery-tracking.controller");
let DeliveryTrackingModule = class DeliveryTrackingModule {
};
exports.DeliveryTrackingModule = DeliveryTrackingModule;
exports.DeliveryTrackingModule = DeliveryTrackingModule = __decorate([
    (0, common_1.Module)({
        imports: [order_timeline_module_1.OrderTimelineModule, websocket_module_1.WebSocketModule],
        controllers: [delivery_tracking_controller_1.BuyerTrackingController, delivery_tracking_controller_1.MerchantTrackingController, delivery_tracking_controller_1.AdminTrackingController],
        providers: [delivery_tracking_service_1.DeliveryTrackingService, delivery_tracking_gateway_1.DeliveryTrackingGateway, delivery_tracking_cache_service_1.DeliveryTrackingCacheService],
        exports: [delivery_tracking_service_1.DeliveryTrackingService, delivery_tracking_cache_service_1.DeliveryTrackingCacheService],
    })
], DeliveryTrackingModule);
//# sourceMappingURL=delivery-tracking.module.js.map