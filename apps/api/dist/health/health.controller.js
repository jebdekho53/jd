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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../database/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let HealthController = class HealthController {
    constructor(health, memory, prisma, redis) {
        this.health = health;
        this.memory = memory;
        this.prisma = prisma;
        this.redis = redis;
    }
    liveness() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
    uptime() {
        return {
            status: 'ok',
            uptimeSec: Math.floor(process.uptime()),
            pid: process.pid,
            timestamp: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV ?? 'unknown',
        };
    }
    database() {
        return this.health.check([() => this.checkPostgres()]);
    }
    redisHealth() {
        return this.health.check([() => this.checkRedis()]);
    }
    readiness() {
        return this.health.check([
            () => this.checkPostgres(),
            () => this.checkRedis(),
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
        ]);
    }
    async checkPostgres() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return { postgresql: { status: 'up' } };
        }
        catch {
            return { postgresql: { status: 'down' } };
        }
    }
    async checkRedis() {
        try {
            const key = 'health:ping';
            await this.redis.set(key, '1', 5);
            const value = await this.redis.get(key);
            if (value !== '1')
                throw new Error('Redis echo failed');
            return { redis: { status: 'up' } };
        }
        catch {
            return { redis: { status: 'down' } };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    openapi.ApiOperation({ description: "Liveness probe \u2014 just confirms the process is running" }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "liveness", null);
__decorate([
    openapi.ApiOperation({ description: "Process uptime for deploy/monitoring (no dependency checks)" }),
    (0, common_1.Get)('uptime'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "uptime", null);
__decorate([
    openapi.ApiOperation({ description: "Database connectivity probe" }),
    (0, common_1.Get)('db'),
    (0, terminus_1.HealthCheck)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "database", null);
__decorate([
    openapi.ApiOperation({ description: "Redis connectivity probe" }),
    (0, common_1.Get)('redis'),
    (0, terminus_1.HealthCheck)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "redisHealth", null);
__decorate([
    openapi.ApiOperation({ description: "Readiness probe \u2014 checks all critical dependencies" }),
    (0, common_1.Get)('ready'),
    (0, terminus_1.HealthCheck)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "readiness", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [typeof (_a = typeof terminus_1.HealthCheckService !== "undefined" && terminus_1.HealthCheckService) === "function" ? _a : Object, typeof (_b = typeof terminus_1.MemoryHealthIndicator !== "undefined" && terminus_1.MemoryHealthIndicator) === "function" ? _b : Object, prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], HealthController);
//# sourceMappingURL=health.controller.js.map