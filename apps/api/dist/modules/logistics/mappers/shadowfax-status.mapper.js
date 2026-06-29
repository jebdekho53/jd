"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapShadowfaxStatus = mapShadowfaxStatus;
exports.normalizedToDeliveryStatus = normalizedToDeliveryStatus;
exports.shadowfaxStatusTable = shadowfaxStatusTable;
const client_1 = require("@prisma/client");
const SHADOWFAX_STATUS_MAP = {
    new: client_1.ShipmentProviderStatus.PENDING,
    pending: client_1.ShipmentProviderStatus.PENDING,
    created: client_1.ShipmentProviderStatus.PENDING,
    assigned: client_1.ShipmentProviderStatus.ASSIGNED,
    allot: client_1.ShipmentProviderStatus.ASSIGNED,
    accepted: client_1.ShipmentProviderStatus.ASSIGNED,
    ofp: client_1.ShipmentProviderStatus.PICKUP_STARTED,
    out_for_pickup: client_1.ShipmentProviderStatus.PICKUP_STARTED,
    pickup_started: client_1.ShipmentProviderStatus.PICKUP_STARTED,
    picked: client_1.ShipmentProviderStatus.PICKED_UP,
    picked_up: client_1.ShipmentProviderStatus.PICKED_UP,
    dispatched: client_1.ShipmentProviderStatus.IN_TRANSIT,
    in_transit: client_1.ShipmentProviderStatus.IN_TRANSIT,
    ofd: client_1.ShipmentProviderStatus.IN_TRANSIT,
    out_for_delivery: client_1.ShipmentProviderStatus.IN_TRANSIT,
    nearby: client_1.ShipmentProviderStatus.NEARBY,
    reached: client_1.ShipmentProviderStatus.NEARBY,
    delivered: client_1.ShipmentProviderStatus.DELIVERED,
    cancelled: client_1.ShipmentProviderStatus.CANCELLED,
    canceled: client_1.ShipmentProviderStatus.CANCELLED,
    failed: client_1.ShipmentProviderStatus.FAILED,
    undelivered: client_1.ShipmentProviderStatus.FAILED,
    rto: client_1.ShipmentProviderStatus.RETURNED,
    returned: client_1.ShipmentProviderStatus.RETURNED,
};
function mapShadowfaxStatus(raw) {
    if (!raw)
        return client_1.ShipmentProviderStatus.PENDING;
    const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
    return SHADOWFAX_STATUS_MAP[key] ?? client_1.ShipmentProviderStatus.PENDING;
}
function normalizedToDeliveryStatus(status) {
    switch (status) {
        case client_1.ShipmentProviderStatus.PENDING:
            return client_1.DeliveryStatus.PENDING;
        case client_1.ShipmentProviderStatus.ASSIGNED:
        case client_1.ShipmentProviderStatus.PICKUP_STARTED:
            return client_1.DeliveryStatus.ASSIGNED;
        case client_1.ShipmentProviderStatus.PICKED_UP:
            return client_1.DeliveryStatus.PICKED_UP;
        case client_1.ShipmentProviderStatus.IN_TRANSIT:
        case client_1.ShipmentProviderStatus.NEARBY:
            return client_1.DeliveryStatus.IN_TRANSIT;
        case client_1.ShipmentProviderStatus.DELIVERED:
            return client_1.DeliveryStatus.DELIVERED;
        case client_1.ShipmentProviderStatus.FAILED:
            return client_1.DeliveryStatus.FAILED;
        case client_1.ShipmentProviderStatus.RETURNED:
        case client_1.ShipmentProviderStatus.CANCELLED:
            return client_1.DeliveryStatus.CANCELLED;
        default:
            return client_1.DeliveryStatus.PENDING;
    }
}
function shadowfaxStatusTable() {
    return Object.entries(SHADOWFAX_STATUS_MAP).map(([provider, normalized]) => ({
        provider,
        normalized,
    }));
}
//# sourceMappingURL=shadowfax-status.mapper.js.map