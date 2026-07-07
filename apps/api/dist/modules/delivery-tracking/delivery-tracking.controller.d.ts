import { RequestUser } from '../../common/types/index';
import { DeliveryTrackingService } from './delivery-tracking.service';
export declare class BuyerTrackingController {
    private readonly tracking;
    constructor(tracking: DeliveryTrackingService);
    getTracking(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: import("./delivery-tracking.service").LiveTrackingView;
    }>;
}
export declare class MerchantTrackingController {
    private readonly tracking;
    constructor(tracking: DeliveryTrackingService);
    getTracking(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: import("./delivery-tracking.service").LiveTrackingView;
    }>;
}
export declare class AdminTrackingController {
    private readonly tracking;
    constructor(tracking: DeliveryTrackingService);
    getOrderTracking(orderId: string): Promise<{
        success: boolean;
        data: import("./delivery-tracking.service").LiveTrackingView;
    }>;
    getFleetLive(status?: string): Promise<{
        success: boolean;
        data: {
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
    }>;
    getAnalytics(): Promise<{
        success: boolean;
        data: {
            avgEtaMins: number;
            avgDeliveryTimeMins: number;
            lateDeliveries: number;
            onlineRiders: number;
            busyRiders: number;
            deliveriesPerRider: {
                riderProfileId: string | null;
                count: number;
            }[];
        };
    }>;
}
