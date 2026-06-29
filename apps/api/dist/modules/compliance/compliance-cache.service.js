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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceCacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const PREFIX = 'compliance:';
let ComplianceCacheService = class ComplianceCacheService {
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        const raw = await this.redis.get(`${PREFIX}${key}`);
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds = 300) {
        await this.redis.set(`${PREFIX}${key}`, JSON.stringify(value), ttlSeconds);
    }
    async invalidate(pattern) {
        try {
            const keys = await this.redis.keys(`${PREFIX}${pattern}*`);
            if (keys.length > 0)
                await this.redis.del(...keys);
        }
        catch {
        }
    }
};
exports.ComplianceCacheService = ComplianceCacheService;
exports.ComplianceCacheService = ComplianceCacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], ComplianceCacheService);
//# sourceMappingURL=compliance-cache.service.js.map