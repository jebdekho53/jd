export declare const TRACKING_EVENTS: {
    readonly LOCATION_UPDATED: "rider.location.updated";
    readonly ORDER_LOCATION_UPDATED: "order.location.updated";
    readonly ETA_UPDATED: "delivery.eta.updated";
    readonly STARTED: "delivery.started";
    readonly ARRIVED: "delivery.arrived";
    readonly COMPLETED: "delivery.completed";
    readonly ORDER_STATUS: "order.status.updated";
};
export type TrackingNamespace = 'buyer' | 'merchant' | 'admin' | 'rider';
export declare function trackingRoom(namespace: TrackingNamespace, id: string): string;
export declare function orderRoom(orderId: string): string;
