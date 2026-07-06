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
            riders: any;
            stats: {
                onlineRiders: any;
                busyRiders: any;
                offlineRiders: any;
                activeOrders: any;
                unassignedOrders: any;
            };
            updatedAt: string;
        };
    }>;
    getAnalytics(): Promise<{
        success: boolean;
        data: {
            avgEtaMins: number;
            avgDeliveryTimeMins: number;
            lateDeliveries: any;
            onlineRiders: any;
            busyRiders: any;
            deliveriesPerRider: any;
        };
    }>;
}
