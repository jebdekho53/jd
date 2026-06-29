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
var RiderAssignmentCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderAssignmentCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
let RiderAssignmentCacheService = RiderAssignmentCacheService_1 = class RiderAssignmentCacheService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(RiderAssignmentCacheService_1.name);
    }
    async invalidateAssignmentCaches(orderId) {
        const patterns = [
            'admin:rider-assignments:*',
            'admin:rider-queue:*',
            'rider:queue:*',
            'order:list:*',
            'buyer:orders:*',
            'merchant:orders:*',
            'merchant:dashboard:*',
            'admin:orders:*',
            'rider:orders:*',
        ];
        if (orderId) {
            try {
                await this.redis.del(`order:detail:${orderId}`);
            }
            catch (err) {
                this.logger.warn(`Detail cache DEL failed: ${err.message}`);
            }
        }
        for (const pattern of patterns) {
            try {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0)
                    await this.redis.del(...keys);
            }
            catch (err) {
                this.logger.warn(`Cache purge failed for ${pattern}: ${err.message}`);
            }
        }
    }
};
exports.RiderAssignmentCacheService = RiderAssignmentCacheService;
exports.RiderAssignmentCacheService = RiderAssignmentCacheService = RiderAssignmentCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RiderAssignmentCacheService);
//# sourceMappingURL=rider-assignment-cache.service.js.map