import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RequestUser } from '../../common/types';
import { TokenPair } from './interfaces/token-pair.interface';
interface UserForToken {
    id: string;
    phone: string;
    email: string | null;
    roles: Array<{
        role: {
            name: string;
        };
    }>;
    permissions: string[];
}
export declare class TokenService {
    private readonly prisma;
    private readonly redis;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly cfg;
    constructor(prisma: PrismaService, redis: RedisService, jwtService: JwtService, configService: ConfigService);
    generateTokenPair(user: UserForToken, deviceId?: string, deviceName?: string, ipAddress?: string, userAgent?: string): Promise<TokenPair>;
    rotateRefreshToken(rawRefreshToken: string, deviceId?: string, ipAddress?: string, userAgent?: string): Promise<TokenPair>;
    revokeByRawToken(rawRefreshToken: string, expectedUserId?: string): Promise<void>;
    revokeAllUserSessions(userId: string): Promise<number>;
    getActiveSessions(userId: string): Promise<Array<{
        id: string;
        deviceName: string | null;
        deviceId: string | null;
        createdAt: Date;
        ipAddress: string | null;
    }>>;
    buildUserForToken(userId: string): Promise<UserForToken>;
    resolveLiveRequestUser(userId: string): Promise<RequestUser>;
    private getUserPermissions;
    private hashToken;
    private revokeToken;
    private parseExpirySeconds;
    private parseExpiryToDate;
}
export {};
