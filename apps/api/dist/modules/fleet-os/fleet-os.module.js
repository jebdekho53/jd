"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetOsModule = void 0;
const common_1 = require("@nestjs/common");
const delivery_tracking_module_1 = require("../delivery-tracking/delivery-tracking.module");
const rider_clustering_service_1 = require("./rider-clustering.service");
const batching_service_1 = require("./batching.service");
const route_optimization_service_1 = require("./route-optimization.service");
const fleet_balancing_service_1 = require("./fleet-balancing.service");
const fleet_alert_service_1 = require("./fleet-alert.service");
const fleet_analytics_service_1 = require("./fleet-analytics.service");
const fleet_payout_service_1 = require("./fleet-payout.service");
const fleet_os_scheduler_1 = require("./fleet-os.scheduler");
const fleet_os_gateway_1 = require("./fleet-os.gateway");
const admin_fleet_os_controller_1 = require("./admin-fleet-os.controller");
const rider_fleet_controller_1 = require("./rider-fleet.controller");
let FleetOsModule = class FleetOsModule {
};
exports.FleetOsModule = FleetOsModule;
exports.FleetOsModule = FleetOsModule = __decorate([
    (0, common_1.Module)({
        imports: [delivery_tracking_module_1.DeliveryTrackingModule],
        controllers: [admin_fleet_os_controller_1.AdminFleetOsController, admin_fleet_os_controller_1.AdminFleetAnalyticsController, rider_fleet_controller_1.RiderFleetController],
        providers: [
            rider_clustering_service_1.RiderClusteringService,
            batching_service_1.BatchingService,
            route_optimization_service_1.RouteOptimizationService,
            fleet_balancing_service_1.FleetBalancingService,
            fleet_alert_service_1.FleetAlertService,
            fleet_analytics_service_1.FleetAnalyticsService,
            fleet_payout_service_1.FleetPayoutService,
            fleet_os_scheduler_1.FleetOsScheduler,
            fleet_os_gateway_1.FleetOsGateway,
        ],
        exports: [batching_service_1.BatchingService, rider_clustering_service_1.RiderClusteringService, fleet_alert_service_1.FleetAlertService, fleet_analytics_service_1.FleetAnalyticsService, fleet_payout_service_1.FleetPayoutService],
    })
], FleetOsModule);
//# sourceMappingURL=fleet-os.module.js.map