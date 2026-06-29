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
var DistributedLockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributedLockService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const redis_service_1 = require("./redis.service");
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;
let DistributedLockService = DistributedLockService_1 = class DistributedLockService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(DistributedLockService_1.name);
    }
    async tryAcquire(lockKey, ttlSeconds) {
        const token = (0, crypto_1.randomUUID)();
        const client = this.redis.getClient();
        const result = await client.set(`lock:${lockKey}`, token, 'EX', ttlSeconds, 'NX');
        return result === 'OK' ? token : null;
    }
    async release(lockKey, token) {
        const client = this.redis.getClient();
        await client.eval(RELEASE_SCRIPT, 1, `lock:${lockKey}`, token);
    }
    async runExclusive(lockKey, ttlSeconds, fn) {
        const token = await this.tryAcquire(lockKey, ttlSeconds);
        if (!token) {
            this.logger.debug(`Lock busy, skipping: ${lockKey}`);
            return false;
        }
        try {
            await fn();
            return true;
        }
        finally {
            await this.release(lockKey, token);
        }
    }
};
exports.DistributedLockService = DistributedLockService;
exports.DistributedLockService = DistributedLockService = DistributedLockService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], DistributedLockService);
//# sourceMappingURL=distributed-lock.service.js.map