export interface BatchableOrder {
    orderId: string;
    locality: string;
    pickupZoneId: string;
    deliveryLat: number;
    deliveryLng: number;
}
export declare const MAX_BATCH_SIZE = 3;
export declare function groupOrdersIntoBatches(orders: BatchableOrder[]): BatchableOrder[][];
