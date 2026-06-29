export declare const LOGISTICS_RETRY_MAX = 3;
export declare const LOGISTICS_RETRY_DELAY_MS = 2000;
export declare const LOGISTICS_HTTP_TIMEOUT_MS = 15000;
export declare const LOGISTICS_EVENTS: {
    readonly SHIPMENT_CREATED: "logistics.shipment.created";
    readonly SHIPMENT_FAILED: "logistics.shipment.failed";
    readonly SHIPMENT_STATUS_UPDATED: "logistics.shipment.status_updated";
    readonly WEBHOOK_RECEIVED: "logistics.webhook.received";
};
