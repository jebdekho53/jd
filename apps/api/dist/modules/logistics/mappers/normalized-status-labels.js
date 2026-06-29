"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NORMALIZED_STATUS_LABELS = void 0;
exports.labelForNormalizedStatus = labelForNormalizedStatus;
const client_1 = require("@prisma/client");
exports.NORMALIZED_STATUS_LABELS = {
    [client_1.ShipmentProviderStatus.PENDING]: 'Shipment created',
    [client_1.ShipmentProviderStatus.ASSIGNED]: 'Delivery partner assigned',
    [client_1.ShipmentProviderStatus.PICKUP_STARTED]: 'Partner heading to store',
    [client_1.ShipmentProviderStatus.PICKED_UP]: 'Order picked up',
    [client_1.ShipmentProviderStatus.IN_TRANSIT]: 'On the way',
    [client_1.ShipmentProviderStatus.NEARBY]: 'Almost there',
    [client_1.ShipmentProviderStatus.DELIVERED]: 'Delivered',
    [client_1.ShipmentProviderStatus.FAILED]: 'Delivery failed',
    [client_1.ShipmentProviderStatus.RETURNED]: 'Returned to store',
    [client_1.ShipmentProviderStatus.CANCELLED]: 'Shipment cancelled',
};
function labelForNormalizedStatus(status) {
    return exports.NORMALIZED_STATUS_LABELS[status] ?? 'In progress';
}
//# sourceMappingURL=normalized-status-labels.js.map