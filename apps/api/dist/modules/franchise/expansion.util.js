"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLaunchReadiness = computeLaunchReadiness;
exports.computeFranchiseShare = computeFranchiseShare;
exports.pincodeSetsOverlap = pincodeSetsOverlap;
const WEIGHTS = {
    storeDensity: 0.3,
    riderSupply: 0.2,
    searchDemand: 0.2,
    population: 0.15,
    procurementCoverage: 0.15,
};
function computeLaunchReadiness(input) {
    const score = input.storeDensity * WEIGHTS.storeDensity +
        input.riderSupply * WEIGHTS.riderSupply +
        input.searchDemand * WEIGHTS.searchDemand +
        input.population * WEIGHTS.population +
        input.procurementCoverage * WEIGHTS.procurementCoverage;
    return Math.min(100, Math.round(score * 100));
}
function computeFranchiseShare(gmv, commissionPercent) {
    const franchiseShare = round(gmv * (commissionPercent / 100));
    return { franchiseShare, platformShare: round(gmv - franchiseShare) };
}
function round(n) {
    return Math.round(n * 100) / 100;
}
function pincodeSetsOverlap(a, b) {
    const setB = new Set(b);
    return a.filter((p) => setB.has(p));
}
//# sourceMappingURL=expansion.util.js.map