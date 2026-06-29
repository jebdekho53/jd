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
var FleetOsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetOsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const rider_clustering_service_1 = require("./rider-clustering.service");
const fleet_alert_service_1 = require("./fleet-alert.service");
const batching_service_1 = require("./batching.service");
let FleetOsScheduler = FleetOsScheduler_1 = class FleetOsScheduler {
    constructor(clusters, alerts, batching) {
        this.clusters = clusters;
        this.alerts = alerts;
        this.batching = batching;
        this.logger = new common_1.Logger(FleetOsScheduler_1.name);
    }
    async refreshFleetState() {
        try {
            await this.clusters.refreshClusters();
            await this.alerts.scanAndCreateAlerts();
            await this.batching.autoBatchUnassigned();
        }
        catch (err) {
            this.logger.error('Fleet OS refresh failed', err instanceof Error ? err.stack : String(err));
        }
    }
};
exports.FleetOsScheduler = FleetOsScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FleetOsScheduler.prototype, "refreshFleetState", null);
exports.FleetOsScheduler = FleetOsScheduler = FleetOsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rider_clustering_service_1.RiderClusteringService,
        fleet_alert_service_1.FleetAlertService,
        batching_service_1.BatchingService])
], FleetOsScheduler);
//# sourceMappingURL=fleet-os.scheduler.js.map