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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
    }
    onModuleInit() {
        const configured = this.configService.get('REDIS_URL');
        const nodeEnv = this.configService.get('NODE_ENV', 'development');
        if (!configured && nodeEnv === 'production') {
            throw new Error('REDIS_URL is required in production');
        }
        const url = configured ?? 'redis://127.0.0.1:6379';
        this.client = new ioredis_1.default(url, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 5) {
                    this.logger.error('Redis: max retries exceeded');
                    return null;
                }
                return Math.min(times * 100, 3000);
            },
            enableReadyCheck: true,
            lazyConnect: false,
        });
        this.client.on('connect', () => this.logger.log('Redis connected'));
        this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
        this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting...'));
    }
    async onModuleDestroy() {
        await this.client.quit();
        this.logger.log('Redis disconnected');
    }
    getClient() {
        return this.client;
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds !== undefined) {
            await this.client.set(key, value, 'EX', ttlSeconds);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(...keys) {
        return this.client.del(...keys);
    }
    async incr(key) {
        return this.client.incr(key);
    }
    async expire(key, ttlSeconds) {
        await this.client.expire(key, ttlSeconds);
    }
    async exists(...keys) {
        const count = await this.client.exists(...keys);
        return count > 0;
    }
    async ttl(key) {
        return this.client.ttl(key);
    }
    async hset(key, field, value) {
        await this.client.hset(key, field, value);
    }
    async hget(key, field) {
        return this.client.hget(key, field);
    }
    async hgetall(key) {
        return this.client.hgetall(key);
    }
    async hdel(key, ...fields) {
        return this.client.hdel(key, ...fields);
    }
    async keys(pattern) {
        return this.client.keys(pattern);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map