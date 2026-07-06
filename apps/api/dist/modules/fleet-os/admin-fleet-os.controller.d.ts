import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { RiderClusteringService } from './rider-clustering.service';
import { BatchingService } from './batching.service';
import { FleetAlertService } from './fleet-alert.service';
import { FleetBalancingService } from './fleet-balancing.service';
import { FleetAnalyticsService } from './fleet-analytics.service';
import { RouteOptimizationService } from './route-optimization.service';
export declare class AdminFleetOsController {
    private readonly tracking;
    private readonly clusters;
    private readonly batching;
    private readonly alerts;
    private readonly balancing;
    private readonly analytics;
    private readonly routes;
    constructor(tracking: DeliveryTrackingService, clusters: RiderClusteringService, batching: BatchingService, alerts: FleetAlertService, balancing: FleetBalancingService, analytics: FleetAnalyticsService, routes: RouteOptimizationService);
    overview(): Promise<{
        success: boolean;
        data: {
            fleet: any;
            clusters: any;
            batches: any;
            alerts: any;
            balance: any;
            metrics: any;
        };
    }>;
}
export declare class AdminFleetAnalyticsController {
    private readonly analytics;
    constructor(analytics: FleetAnalyticsService);
    fleet(): Promise<{
        success: boolean;
        data: {
            riderUtilization: number;
            avgBatchSize: number;
            routeEfficiency: number;
            deliveryCostSavings: number;
            clusterDemandRatios: any;
            activeBatches: any;
        };
    }>;
}
