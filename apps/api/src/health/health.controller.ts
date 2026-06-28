import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiExcludeController } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Liveness probe — just confirms the process is running */
  @Get()
  liveness(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Database connectivity probe */
  @Get('db')
  @HealthCheck()
  database(): Promise<HealthCheckResult> {
    return this.health.check([() => this.checkPostgres()]);
  }

  /** Redis connectivity probe */
  @Get('redis')
  @HealthCheck()
  redisHealth(): Promise<HealthCheckResult> {
    return this.health.check([() => this.checkRedis()]);
  }

  /** Readiness probe — checks all critical dependencies */
  @Get('ready')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.checkPostgres(),
      () => this.checkRedis(),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  private async checkPostgres(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { postgresql: { status: 'up' } };
    } catch {
      return { postgresql: { status: 'down' } };
    }
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      const key = 'health:ping';
      await this.redis.set(key, '1', 5);
      const value = await this.redis.get(key);
      if (value !== '1') throw new Error('Redis echo failed');
      return { redis: { status: 'up' } };
    } catch {
      return { redis: { status: 'down' } };
    }
  }
}
