"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFleetAnalyticsController = exports.AdminFleetOsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const delivery_tracking_service_1 = require("../delivery-tracking/delivery-tracking.service");
const rider_clustering_service_1 = require("./rider-clustering.service");
const batching_service_1 = require("./batching.service");
const fleet_alert_service_1 = require("./fleet-alert.service");
const fleet_balancing_service_1 = require("./fleet-balancing.service");
const fleet_analytics_service_1 = require("./fleet-analytics.service");
const route_optimization_service_1 = require("./route-optimization.service");
let AdminFleetOsController = class AdminFleetOsController {
    constructor(tracking, clusters, batching, alerts, balancing, analytics, routes) {
        this.tracking = tracking;
        this.clusters = clusters;
        this.batching = batching;
        this.alerts = alerts;
        this.balancing = balancing;
        this.analytics = analytics;
        this.routes = routes;
    }
    async overview() {
        const [fleet, clusterList, batches, alertList, balance, metrics] = await Promise.all([
            this.tracking.getFleetLive(),
            this.clusters.listClusters(),
            this.batching.listActiveBatches(),
            this.alerts.listOpenAlerts(),
            this.balancing.getBalanceSuggestions(),
            this.analytics.getAdminFleetAnalytics(),
        ]);
        return {
            success: true,
            data: { fleet, clusters: clusterList, batches, alerts: alertList, balance, metrics },
        };
    }
};
exports.AdminFleetOsController = AdminFleetOsController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFleetOsController.prototype, "overview", null);
exports.AdminFleetOsController = AdminFleetOsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/fleet-os'),
    __metadata("design:paramtypes", [delivery_tracking_service_1.DeliveryTrackingService,
        rider_clustering_service_1.RiderClusteringService,
        batching_service_1.BatchingService,
        fleet_alert_service_1.FleetAlertService,
        fleet_balancing_service_1.FleetBalancingService,
        fleet_analytics_service_1.FleetAnalyticsService,
        route_optimization_service_1.RouteOptimizationService])
], AdminFleetOsController);
let AdminFleetAnalyticsController = class AdminFleetAnalyticsController {
    constructor(analytics) {
        this.analytics = analytics;
    }
    async fleet() {
        return { success: true, data: await this.analytics.getAdminFleetAnalytics() };
    }
};
exports.AdminFleetAnalyticsController = AdminFleetAnalyticsController;
__decorate([
    (0, common_1.Get)('fleet'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFleetAnalyticsController.prototype, "fleet", null);
exports.AdminFleetAnalyticsController = AdminFleetAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/analytics'),
    __metadata("design:paramtypes", [fleet_analytics_service_1.FleetAnalyticsService])
], AdminFleetAnalyticsController);
//# sourceMappingURL=admin-fleet-os.controller.js.map