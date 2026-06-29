import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Msg91Service } from './msg91.service';
export declare class OtpService {
    private readonly prisma;
    private readonly redis;
    private readonly msg91;
    private readonly configService;
    private readonly logger;
    private readonly cfg;
    constructor(prisma: PrismaService, redis: RedisService, msg91: Msg91Service, configService: ConfigService);
    requestOtp(phone: string, purpose: OtpPurpose, userId?: string, options?: {
        skipSms?: boolean;
    }): Promise<{
        expiresIn: number;
        code: string;
    }>;
    verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<string>;
    private resolveOtpCode;
    private generateCode;
    private enforceRateLimit;
}
