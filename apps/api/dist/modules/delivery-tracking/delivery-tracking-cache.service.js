"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeliveryTrackingCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryTrackingCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const TRACKING_CACHE_TTL = 30;
const ETA_CACHE_TTL = 30;
let DeliveryTrackingCacheService = DeliveryTrackingCacheService_1 = class DeliveryTrackingCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(DeliveryTrackingCacheService_1.name);
    }
    trackingKey(orderId) {
        return `tracking:order:${orderId}`;
    }
    etaKey(orderId) {
        return `tracking:eta:${orderId}`;
    }
    fleetKey() {
        return 'tracking:fleet:live';
    }
    async getTracking(orderId) {
        try {
            const raw = await this.redis.get(this.trackingKey(orderId));
            return raw ? JSON.parse(raw) : null;
        }
        catch (err) {
            this.logger.warn(`Tracking cache GET: ${err.message}`);
            return null;
        }
    }
    async setTracking(orderId, data) {
        try {
            await this.redis.set(this.trackingKey(orderId), JSON.stringify(data), TRACKING_CACHE_TTL);
        }
        catch (err) {
            this.logger.warn(`Tracking cache SET: ${err.message}`);
        }
    }
    async invalidateTracking(orderId) {
        try {
            await this.redis.del(this.trackingKey(orderId), this.etaKey(orderId));
        }
        catch (err) {
            this.logger.warn(`Tracking cache DEL: ${err.message}`);
        }
    }
    async setEta(orderId, data) {
        try {
            await this.redis.set(this.etaKey(orderId), JSON.stringify(data), ETA_CACHE_TTL);
        }
        catch (err) {
            this.logger.warn(`ETA cache SET: ${err.message}`);
        }
    }
    async invalidateFleet() {
        try {
            await this.redis.del(this.fleetKey());
        }
        catch (err) {
            this.logger.warn(`Fleet cache DEL: ${err.message}`);
        }
    }
};
exports.DeliveryTrackingCacheService = DeliveryTrackingCacheService;
exports.DeliveryTrackingCacheService = DeliveryTrackingCacheService = DeliveryTrackingCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], DeliveryTrackingCacheService);
//# sourceMappingURL=delivery-tracking-cache.service.js.map