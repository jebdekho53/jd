"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFleetPayout = computeFleetPayout;
function computeFleetPayout(input) {
    const singleDeliveryPayout = round(input.baseEarning);
    const batchBonus = input.batchSize > 1 ? round(input.baseEarning * 0.1 * (input.batchSize - 1)) : 0;
    const distancePayout = round(input.distanceKm * 8);
    const efficiencyBonus = input.optimized ? round(input.baseEarning * 0.05) : 0;
    const total = round(singleDeliveryPayout + batchBonus + distancePayout + efficiencyBonus);
    return { singleDeliveryPayout, batchBonus, distancePayout, efficiencyBonus, total };
}
function round(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=fleet-payout.util.js.map