import { HealthCheckResult, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class HealthController {
    private readonly health;
    private readonly memory;
    private readonly prisma;
    private readonly redis;
    constructor(health: HealthCheckService, memory: MemoryHealthIndicator, prisma: PrismaService, redis: RedisService);
    liveness(): {
        status: string;
        timestamp: string;
    };
    uptime(): {
        status: string;
        uptimeSec: number;
        pid: number;
        timestamp: string;
        nodeEnv: string;
    };
    database(): Promise<HealthCheckResult>;
    redisHealth(): Promise<HealthCheckResult>;
    readiness(): Promise<HealthCheckResult>;
    private checkPostgres;
    private checkRedis;
}
