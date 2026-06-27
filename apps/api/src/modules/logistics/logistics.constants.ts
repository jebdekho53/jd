export const LOGISTICS_RETRY_MAX = 3;
export const LOGISTICS_RETRY_DELAY_MS = 2000;
export const LOGISTICS_HTTP_TIMEOUT_MS = 15000;

export const LOGISTICS_EVENTS = {
  SHIPMENT_CREATED: 'logistics.shipment.created',
  SHIPMENT_FAILED: 'logistics.shipment.failed',
  SHIPMENT_STATUS_UPDATED: 'logistics.shipment.status_updated',
  WEBHOOK_RECEIVED: 'logistics.webhook.received',
} as const;
