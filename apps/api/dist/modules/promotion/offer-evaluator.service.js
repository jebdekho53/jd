"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferEvaluatorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let OfferEvaluatorService = class OfferEvaluatorService {
    isOfferActive(offer, now = new Date()) {
        if (!offer.isActive || offer.pausedAt)
            return false;
        if (now < offer.startsAt || now > offer.expiresAt)
            return false;
        if (offer.usageLimit != null && offer.usedCount >= offer.usageLimit)
            return false;
        if (offer.kind === client_1.OfferKind.FLASH_SALE && offer.flashQtyLimit != null) {
            if (offer.flashQtySold >= offer.flashQtyLimit)
                return false;
        }
        return true;
    }
    passesRules(offer, ctx) {
        if (Number(offer.minOrderAmount) > ctx.subtotal)
            return false;
        const userUsage = ctx.perUserUsage.get(offer.id) ?? 0;
        if (userUsage >= offer.perUserLimit)
            return false;
        if (offer.kind === client_1.OfferKind.FIRST_ORDER && ctx.completedOrderCount > 0) {
            return false;
        }
        for (const rule of offer.rules) {
            if (!this.evaluateRule(rule, offer, ctx))
                return false;
        }
        if (offer.kind === client_1.OfferKind.HAPPY_HOUR) {
            const happyRule = offer.rules.find((r) => r.ruleType === client_1.OfferRuleType.HAPPY_HOUR);
            if (happyRule && !this.evaluateRule(happyRule, offer, ctx))
                return false;
            if (!happyRule && !this.isHappyHourNow())
                return false;
        }
        if (offer.kind === client_1.OfferKind.LOCALITY_BASED) {
            const locRule = offer.rules.find((r) => r.ruleType === client_1.OfferRuleType.LOCALITY);
            if (locRule && !this.evaluateRule(locRule, offer, ctx))
                return false;
        }
        if (offer.kind === client_1.OfferKind.REFERRAL_CAMPAIGN && !ctx.hasReferralCode) {
            return false;
        }
        return true;
    }
    passesAudience(audienceType, config, ctx) {
        switch (audienceType) {
            case client_1.AudienceType.ALL:
                return true;
            case client_1.AudienceType.NEW_USERS:
                return ctx.completedOrderCount === 0;
            case client_1.AudienceType.WALLET_TIER: {
                const tiers = config.tiers ?? [];
                return tiers.length === 0 || tiers.includes(ctx.walletTier);
            }
            case client_1.AudienceType.LOCALITY: {
                if (ctx.lat == null || ctx.lng == null)
                    return false;
                const center = config.center;
                const radiusKm = Number(config.radiusKm ?? 5);
                if (!center)
                    return true;
                return this.haversineKm(ctx.lat, ctx.lng, center.lat, center.lng) <= radiusKm;
            }
            case client_1.AudienceType.CATEGORY_AFFINITY: {
                const cats = config.categoryIds ?? [];
                return cats.some((c) => ctx.favoriteCategoryIds.includes(c));
            }
            case client_1.AudienceType.SEARCH_HISTORY:
                return true;
            default:
                return true;
        }
    }
    evaluateRule(rule, offer, ctx) {
        const config = rule.config;
        switch (rule.ruleType) {
            case client_1.OfferRuleType.HAPPY_HOUR:
                return this.isInTimeWindow(config);
            case client_1.OfferRuleType.LOCALITY: {
                if (ctx.lat == null || ctx.lng == null)
                    return false;
                const center = config.center;
                const radiusKm = Number(config.radiusKm ?? 3);
                return this.haversineKm(ctx.lat, ctx.lng, center.lat, center.lng) <= radiusKm;
            }
            case client_1.OfferRuleType.FIRST_ORDER:
                return ctx.completedOrderCount === 0;
            case client_1.OfferRuleType.WALLET_TIER: {
                const tiers = config.tiers ?? [];
                return tiers.includes(ctx.walletTier);
            }
            case client_1.OfferRuleType.MIN_ORDER:
                return ctx.subtotal >= Number(config.minAmount ?? offer.minOrderAmount);
            case client_1.OfferRuleType.FLASH_INVENTORY:
                return offer.flashQtyLimit == null || offer.flashQtySold < offer.flashQtyLimit;
            case client_1.OfferRuleType.REFERRAL:
                return ctx.hasReferralCode;
            case client_1.OfferRuleType.CATEGORY_AFFINITY: {
                const cats = config.categoryIds ?? [];
                return cats.some((c) => ctx.favoriteCategoryIds.includes(c));
            }
            default:
                return true;
        }
    }
    isHappyHourNow() {
        const hour = new Date().getHours();
        return hour >= 14 && hour < 17;
    }
    isInTimeWindow(config) {
        const startHour = Number(config.startHour ?? 14);
        const endHour = Number(config.endHour ?? 17);
        const hour = new Date().getHours();
        if (startHour <= endHour)
            return hour >= startHour && hour < endHour;
        return hour >= startHour || hour < endHour;
    }
    haversineKm(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
};
exports.OfferEvaluatorService = OfferEvaluatorService;
exports.OfferEvaluatorService = OfferEvaluatorService = __decorate([
    (0, common_1.Injectable)()
], OfferEvaluatorService);
//# sourceMappingURL=offer-evaluator.service.js.map