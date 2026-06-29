"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAPACITY_OVERLOAD_THRESHOLD = void 0;
exports.computeRoutingScore = computeRoutingScore;
exports.estimateEtaMins = estimateEtaMins;
const WEIGHTS = {
    inventory: 0.4,
    eta: 0.25,
    capacity: 0.15,
    deliverySuccess: 0.1,
    cost: 0.1,
};
const MAX_ETA_MINS = 60;
const MAX_COST = 100;
function computeRoutingScore(input) {
    const inventoryPenalty = 1 - Math.min(1, Math.max(0, input.inventoryAvailability));
    const etaNorm = Math.min(1, input.etaMins / MAX_ETA_MINS);
    const capacityNorm = Math.min(1, input.capacityLoadPct / 100);
    const successPenalty = 1 - Math.min(1, Math.max(0, input.deliverySuccessRate));
    const costNorm = Math.min(1, input.fulfillmentCost / MAX_COST);
    return (inventoryPenalty * WEIGHTS.inventory +
        etaNorm * WEIGHTS.eta +
        capacityNorm * WEIGHTS.capacity +
        successPenalty * WEIGHTS.deliverySuccess +
        costNorm * WEIGHTS.cost);
}
function estimateEtaMins(distanceKm, avgPrepTimeMins) {
    const travelMins = Math.ceil((distanceKm / 20) * 60);
    return avgPrepTimeMins + travelMins;
}
exports.CAPACITY_OVERLOAD_THRESHOLD = 90;
//# sourceMappingURL=smart-fulfillment.util.js.map