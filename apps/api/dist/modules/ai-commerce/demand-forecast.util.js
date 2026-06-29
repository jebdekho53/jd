"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictDemand = predictDemand;
function predictDemand(input, horizonDays) {
    const dailyOrders = input.orderQty7d / 7;
    const dailySearch = input.searchHits7d / 7;
    const dailyCart = input.cartAdds7d / 7;
    const trend = input.orderQty7d > 0 ? input.orderQty7d / Math.max(1, input.orderQty30d / 4) : 1;
    const base = dailyOrders * 0.5 + dailySearch * 0.15 + dailyCart * 0.25;
    const boosted = base * (1 + input.campaignBoost) * Math.min(1.5, trend);
    const predictedDemand = Math.max(0, Math.round(boosted * horizonDays));
    const dataPoints = [input.orderQty7d, input.searchHits7d, input.cartAdds7d].filter((n) => n > 0).length;
    const confidenceScore = Math.min(100, Math.round(40 + dataPoints * 15 + (input.orderQty30d > 10 ? 20 : 0)));
    return { predictedDemand, confidenceScore };
}
//# sourceMappingURL=demand-forecast.util.js.map