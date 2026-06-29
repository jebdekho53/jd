"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGISTICS_EVENTS = exports.LOGISTICS_HTTP_TIMEOUT_MS = exports.LOGISTICS_RETRY_DELAY_MS = exports.LOGISTICS_RETRY_MAX = void 0;
exports.LOGISTICS_RETRY_MAX = 3;
exports.LOGISTICS_RETRY_DELAY_MS = 2000;
exports.LOGISTICS_HTTP_TIMEOUT_MS = 15000;
exports.LOGISTICS_EVENTS = {
    SHIPMENT_CREATED: 'logistics.shipment.created',
    SHIPMENT_FAILED: 'logistics.shipment.failed',
    SHIPMENT_STATUS_UPDATED: 'logistics.shipment.status_updated',
    WEBHOOK_RECEIVED: 'logistics.webhook.received',
};
//# sourceMappingURL=logistics.constants.js.map