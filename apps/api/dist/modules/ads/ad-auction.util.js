"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankAdAuction = rankAdAuction;
exports.computeCtr = computeCtr;
exports.computeRoas = computeRoas;
function rankAdAuction(candidates, maxSlots = 3) {
    const scored = candidates.map((c) => {
        const ctrBoost = 1 + Math.min(0.5, c.ctr);
        const quality = Math.max(0.1, Math.min(1, c.qualityScore));
        const auctionScore = c.bidAmount * quality * ctrBoost + c.priority * 0.01;
        return { ...c, auctionScore };
    });
    return scored.sort((a, b) => b.auctionScore - a.auctionScore).slice(0, maxSlots);
}
function computeCtr(clicks, impressions) {
    if (impressions <= 0)
        return 0.02;
    return Math.min(1, clicks / impressions);
}
function computeRoas(revenue, spend) {
    if (spend <= 0)
        return 0;
    return Math.round((revenue / spend) * 100) / 100;
}
//# sourceMappingURL=ad-auction.util.js.map