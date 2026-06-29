"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANKING_WEIGHTS = void 0;
exports.normalizeRelevance = normalizeRelevance;
exports.normalizeDistance = normalizeDistance;
exports.normalizeInventory = normalizeInventory;
exports.normalizeRating = normalizeRating;
exports.normalizeDeliverySpeed = normalizeDeliverySpeed;
exports.computeHyperlocalScore = computeHyperlocalScore;
exports.textRelevanceScore = textRelevanceScore;
exports.estimateDeliveryEtaMins = estimateDeliveryEtaMins;
exports.RANKING_WEIGHTS = {
    relevance: 0.4,
    distance: 0.2,
    inventory: 0.15,
    rating: 0.1,
    deliverySpeed: 0.1,
    offer: 0.05,
};
function normalizeRelevance(raw) {
    return Math.min(1, raw / 200);
}
function normalizeDistance(distanceKm, maxKm) {
    if (distanceKm == null || maxKm <= 0)
        return 0.35;
    return 1 - Math.min(1, distanceKm / maxKm);
}
function normalizeInventory(qty, maxInPool) {
    if (qty <= 0)
        return 0;
    if (maxInPool <= 0)
        return 1;
    return Math.min(1, qty / maxInPool);
}
function normalizeRating(ratingAvg) {
    return Math.min(1, Math.max(0, ratingAvg) / 5);
}
function normalizeDeliverySpeed(avgPrepTimeMins) {
    const capped = Math.max(5, Math.min(90, avgPrepTimeMins || 20));
    return 1 - (capped - 5) / 85;
}
function computeHyperlocalScore(signals) {
    const relevance = normalizeRelevance(signals.relevance);
    const distance = normalizeDistance(signals.distanceKm, signals.maxDistanceKm);
    const inventory = normalizeInventory(signals.availableQty, signals.maxQtyInPool);
    const rating = normalizeRating(signals.ratingAvg);
    const delivery = normalizeDeliverySpeed(signals.avgPrepTimeMins);
    let offer = signals.hasActiveOffer ? 1 : 0;
    if (signals.isFlashSale)
        offer = Math.min(1, offer + 0.5);
    if (signals.campaignConversion != null && signals.campaignConversion > 5) {
        offer = Math.min(1, offer + 0.25);
    }
    return (exports.RANKING_WEIGHTS.relevance * relevance +
        exports.RANKING_WEIGHTS.distance * distance +
        exports.RANKING_WEIGHTS.inventory * inventory +
        exports.RANKING_WEIGHTS.rating * rating +
        exports.RANKING_WEIGHTS.deliverySpeed * delivery +
        exports.RANKING_WEIGHTS.offer * offer);
}
function textRelevanceScore(fields, rawQuery) {
    const q = rawQuery.toLowerCase().trim();
    if (!q)
        return 0;
    let score = 0;
    const nameL = fields.name.toLowerCase();
    if (nameL === q)
        score += 200;
    else if (nameL.includes(q))
        score += 100;
    else if (q.split(/\s+/).every((w) => nameL.includes(w)))
        score += 80;
    const brandL = (fields.brand ?? '').toLowerCase();
    if (brandL === q)
        score += 100;
    else if (brandL.includes(q))
        score += 50;
    for (const tag of fields.tags) {
        const tagL = tag.toLowerCase();
        if (tagL === q)
            score += 50;
        else if (tagL.includes(q))
            score += 25;
    }
    const descL = (fields.description ?? '').toLowerCase();
    if (descL.includes(q))
        score += 10;
    return score;
}
function estimateDeliveryEtaMins(distanceKm, avgPrepTimeMins) {
    const travelMins = Math.round((distanceKm / 20) * 60);
    return Math.max(10, avgPrepTimeMins + travelMins);
}
//# sourceMappingURL=search-ranking.util.js.map