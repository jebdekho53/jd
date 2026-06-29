import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    getClient(): Redis;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(...keys: string[]): Promise<number>;
    incr(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<void>;
    exists(...keys: string[]): Promise<boolean>;
    ttl(key: string): Promise<number>;
    hset(key: string, field: string, value: string): Promise<void>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
}
