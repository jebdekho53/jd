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
var RiderLocationService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderLocationService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../database/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const delivery_tracking_service_1 = require("../delivery-tracking/delivery-tracking.service");
const LOCATION_CACHE_TTL = 60;
const LOCATION_HISTORY_DAYS = 30;
let RiderLocationService = RiderLocationService_1 = class RiderLocationService {
    constructor(prisma, redis, events, tracking) {
        this.prisma = prisma;
        this.redis = redis;
        this.events = events;
        this.tracking = tracking;
        this.logger = new common_1.Logger(RiderLocationService_1.name);
    }
    cacheKey(riderProfileId) {
        return `rider:loc:${riderProfileId}`;
    }
    async updateLocation(riderProfileId, dto) {
        const now = new Date();
        await this.prisma.riderProfile.update({
            where: { id: riderProfileId },
            data: {
                currentLat: dto.latitude,
                currentLng: dto.longitude,
                currentHeading: dto.heading,
                currentSpeed: dto.speed,
                lastLocationAt: now,
            },
        });
        await this.prisma.riderLocation.create({
            data: {
                riderProfileId,
                latitude: dto.latitude,
                longitude: dto.longitude,
                heading: dto.heading,
                speed: dto.speed,
                accuracy: dto.accuracy,
                recordedAt: now,
            },
        });
        try {
            const payload = {
                riderProfileId,
                latitude: dto.latitude,
                longitude: dto.longitude,
                heading: dto.heading,
                speed: dto.speed,
                recordedAt: now.toISOString(),
            };
            await this.redis.set(this.cacheKey(riderProfileId), JSON.stringify(payload), LOCATION_CACHE_TTL);
        }
        catch (err) {
            this.logger.warn(`Location cache SET error: ${err.message}`);
        }
        this.events.emit('ws.rider.location.updated', {
            riderProfileId,
            lat: dto.latitude,
            lng: dto.longitude,
        });
        await this.tracking.processRiderLocation(riderProfileId, dto);
    }
    async getLatestLocation(riderProfileId) {
        try {
            const raw = await this.redis.get(this.cacheKey(riderProfileId));
            if (raw)
                return JSON.parse(raw);
        }
        catch (err) {
            this.logger.warn(`Location cache GET error: ${err.message}`);
        }
        const profile = await this.prisma.riderProfile.findUnique({
            where: { id: riderProfileId },
            select: { currentLat: true, currentLng: true, lastLocationAt: true },
        });
        if (!profile?.currentLat || !profile?.currentLng)
            return null;
        return {
            riderProfileId,
            latitude: profile.currentLat,
            longitude: profile.currentLng,
            recordedAt: profile.lastLocationAt?.toISOString() ?? new Date(0).toISOString(),
        };
    }
    async pruneOldLocations() {
        const cutoff = new Date(Date.now() - LOCATION_HISTORY_DAYS * 24 * 60 * 60 * 1000);
        const result = await this.prisma.riderLocation.deleteMany({
            where: { recordedAt: { lt: cutoff } },
        });
        if (result.count > 0) {
            this.logger.log(`Pruned ${result.count} rider location records older than ${LOCATION_HISTORY_DAYS} days`);
        }
    }
};
exports.RiderLocationService = RiderLocationService;
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiderLocationService.prototype, "pruneOldLocations", null);
exports.RiderLocationService = RiderLocationService = RiderLocationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService, typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object, delivery_tracking_service_1.DeliveryTrackingService])
], RiderLocationService);
//# sourceMappingURL=rider-location.service.js.map