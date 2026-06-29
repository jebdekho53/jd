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
            fleet: {
                riders: {
                    id: string;
                    name: string;
                    phone: string;
                    status: string;
                    vehicleType: import("@prisma/client").$Enums.VehicleType;
                    zone: string;
                    location: {
                        lat: number;
                        lng: number;
                        heading: number | null;
                        speed: number | null;
                        lastLocationAt: string | null;
                    } | null;
                    currentDelivery: {
                        orderId: string;
                        orderNumber: string;
                        status: import("@prisma/client").$Enums.DeliveryStatus;
                        etaMins: number | null;
                    } | null;
                }[];
                stats: {
                    onlineRiders: number;
                    busyRiders: number;
                    offlineRiders: number;
                    activeOrders: number;
                    unassignedOrders: number;
                };
                updatedAt: string;
            };
            clusters: {
                city: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                locality: string;
                activeRiders: number;
                activeOrders: number;
                demandSupplyRatio: number;
            }[];
            batches: ({
                items: ({
                    order: {
                        orderNumber: string;
                    };
                } & {
                    id: string;
                    orderId: string;
                    batchId: string;
                    sequence: number;
                })[];
                rider: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.DeliveryBatchStatus;
                createdAt: Date;
                updatedAt: Date;
                completedAt: Date | null;
                riderId: string;
                totalOrders: number;
            })[];
            alerts: {
                city: string | null;
                message: string;
                id: string;
                status: import("@prisma/client").$Enums.FleetAlertStatus;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                resolvedAt: Date | null;
                alertType: import("@prisma/client").$Enums.FleetAlertType;
                riderProfileId: string | null;
                locality: string | null;
            }[];
            balance: {
                from: {
                    city: string;
                    locality: string;
                    riders: number;
                };
                to: {
                    city: string;
                    locality: string;
                    orders: number;
                };
                ridersToMove: number;
            }[];
            metrics: {
                riderUtilization: number;
                avgBatchSize: number;
                routeEfficiency: number;
                deliveryCostSavings: number;
                clusterDemandRatios: {
                    city: string;
                    locality: string;
                    ratio: number;
                }[];
                activeBatches: number;
            };
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
            clusterDemandRatios: {
                city: string;
                locality: string;
                ratio: number;
            }[];
            activeBatches: number;
        };
    }>;
}
