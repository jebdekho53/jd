import { RiderClusteringService } from './rider-clustering.service';
import { FleetAlertService } from './fleet-alert.service';
import { BatchingService } from './batching.service';
export declare class FleetOsScheduler {
    private readonly clusters;
    private readonly alerts;
    private readonly batching;
    private readonly logger;
    constructor(clusters: RiderClusteringService, alerts: FleetAlertService, batching: BatchingService);
    refreshFleetState(): Promise<void>;
}
