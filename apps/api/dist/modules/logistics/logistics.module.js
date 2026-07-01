"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsModule = void 0;
const common_1 = require("@nestjs/common");
const rider_assignment_module_1 = require("../rider-assignment/rider-assignment.module");
const order_fulfillment_module_1 = require("../order/order-fulfillment.module");
const shadowfax_client_1 = require("./providers/shadowfax/shadowfax.client");
const shadowfax_provider_1 = require("./providers/shadowfax/shadowfax.provider");
const stub_providers_1 = require("./providers/stub/stub-providers");
const own_fleet_provider_1 = require("./providers/own-fleet/own-fleet.provider");
const logistics_provider_registry_1 = require("./logistics-provider.registry");
const delivery_orchestrator_service_1 = require("./delivery-orchestrator.service");
const delivery_dispatch_service_1 = require("./delivery-dispatch.service");
const shipment_tracking_scheduler_1 = require("./shipment-tracking.scheduler");
const shadowfax_webhook_service_1 = require("./webhooks/shadowfax-webhook.service");
const logistics_webhook_controller_1 = require("./webhooks/logistics-webhook.controller");
const merchant_logistics_controller_1 = require("./merchant-logistics.controller");
const admin_logistics_controller_1 = require("./admin-logistics.controller");
let LogisticsModule = class LogisticsModule {
};
exports.LogisticsModule = LogisticsModule;
exports.LogisticsModule = LogisticsModule = __decorate([
    (0, common_1.Module)({
        imports: [rider_assignment_module_1.RiderAssignmentModule, (0, common_1.forwardRef)(() => order_fulfillment_module_1.OrderFulfillmentModule)],
        controllers: [
            logistics_webhook_controller_1.LogisticsWebhookController,
            merchant_logistics_controller_1.MerchantLogisticsController,
            admin_logistics_controller_1.AdminLogisticsController,
        ],
        providers: [
            shadowfax_client_1.ShadowfaxClient,
            shadowfax_provider_1.ShadowfaxProvider,
            stub_providers_1.PorterProvider,
            stub_providers_1.DelhiveryProvider,
            stub_providers_1.BorzoProvider,
            own_fleet_provider_1.OwnFleetProvider,
            logistics_provider_registry_1.LogisticsProviderRegistry,
            delivery_orchestrator_service_1.DeliveryOrchestratorService,
            delivery_dispatch_service_1.DeliveryDispatchService,
            shipment_tracking_scheduler_1.ShipmentTrackingScheduler,
            shadowfax_webhook_service_1.ShadowfaxWebhookService,
        ],
        exports: [delivery_dispatch_service_1.DeliveryDispatchService, delivery_orchestrator_service_1.DeliveryOrchestratorService, logistics_provider_registry_1.LogisticsProviderRegistry],
    })
], LogisticsModule);
//# sourceMappingURL=logistics.module.js.map