"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeReplenishmentQty = computeReplenishmentQty;
exports.predictOosDays = predictOosDays;
function computeReplenishmentQty(currentStock, avgDailySales) {
    const targetDays = 14;
    const targetStock = Math.ceil(avgDailySales * targetDays);
    return Math.max(10, targetStock - currentStock);
}
function predictOosDays(currentStock, avgDailySales) {
    if (avgDailySales <= 0)
        return 999;
    return currentStock / avgDailySales;
}
//# sourceMappingURL=replenishment.util.js.map