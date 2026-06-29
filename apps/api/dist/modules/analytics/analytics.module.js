"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const websocket_module_1 = require("../../common/websocket/websocket.module");
const analytics_aggregator_service_1 = require("./analytics-aggregator.service");
const analytics_snapshot_service_1 = require("./analytics-snapshot.service");
const analytics_materializer_service_1 = require("./analytics-materializer.service");
const analytics_metrics_cache_service_1 = require("./analytics-metrics-cache.service");
const analytics_alert_service_1 = require("./analytics-alert.service");
const analytics_export_service_1 = require("./analytics-export.service");
const admin_analytics_controller_1 = require("./admin-analytics.controller");
const merchant_analytics_controller_1 = require("./merchant-analytics.controller");
const analytics_gateway_1 = require("./analytics.gateway");
const delivery_tracking_module_1 = require("../delivery-tracking/delivery-tracking.module");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [delivery_tracking_module_1.DeliveryTrackingModule, merchant_dashboard_module_1.MerchantDashboardModule, websocket_module_1.WebSocketModule],
        controllers: [admin_analytics_controller_1.AdminAnalyticsController, merchant_analytics_controller_1.MerchantAnalyticsController],
        providers: [
            analytics_service_1.AnalyticsService,
            analytics_aggregator_service_1.AnalyticsAggregatorService,
            analytics_snapshot_service_1.AnalyticsSnapshotService,
            analytics_materializer_service_1.AnalyticsMaterializerService,
            analytics_metrics_cache_service_1.AnalyticsMetricsCacheService,
            analytics_alert_service_1.AnalyticsAlertService,
            analytics_export_service_1.AnalyticsExportService,
            analytics_gateway_1.AnalyticsGateway,
        ],
        exports: [analytics_service_1.AnalyticsService, analytics_metrics_cache_service_1.AnalyticsMetricsCacheService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map