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
var TokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../database/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const configuration_1 = require("../../config/configuration");
let TokenService = TokenService_1 = class TokenService {
    constructor(prisma, redis, jwtService, configService) {
        this.prisma = prisma;
        this.redis = redis;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(TokenService_1.name);
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    async generateTokenPair(user, deviceId, deviceName, ipAddress, userAgent, rememberMe = false, authTime) {
        const roles = user.roles.map((r) => r.role.name);
        const permissions = user.permissions;
        const actualAuthTime = authTime ?? Math.floor(Date.now() / 1000);
        const payload = {
            sub: user.id,
            phone: user.phone,
            email: user.email,
            roles,
            permissions,
            kid: this.cfg.jwt.keyId,
            authTime: actualAuthTime,
            amr: authTime ? ['refresh'] : ['otp'],
        };
        const accessToken = this.jwtService.sign(payload);
        const expiresIn = this.parseExpirySeconds(this.cfg.jwt.accessExpiresIn);
        const rawRefreshToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = this.hashToken(rawRefreshToken);
        const refreshExpiryStr = rememberMe ? '30d' : '1d';
        const refreshExpiresAt = this.parseExpiryToDate(refreshExpiryStr);
        await this.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash,
                deviceId: deviceId ?? (0, uuid_1.v4)(),
                deviceName: deviceName ?? 'Unknown Device',
                ipAddress,
                userAgent,
                expiresAt: refreshExpiresAt,
                rememberMe,
                authTime: new Date(actualAuthTime * 1000),
            },
        });
        return { accessToken, refreshToken: rawRefreshToken, expiresIn, rememberMe };
    }
    async generateStepUpToken(userId) {
        const user = await this.buildUserForToken(userId);
        const roles = user.roles.map((r) => r.role.name);
        const permissions = user.permissions;
        const payload = {
            sub: user.id,
            phone: user.phone,
            email: user.email,
            roles,
            permissions,
            kid: this.cfg.jwt.keyId,
            authTime: Math.floor(Date.now() / 1000),
            amr: ['step-up'],
        };
        const accessToken = this.jwtService.sign(payload);
        const expiresIn = this.parseExpirySeconds(this.cfg.jwt.accessExpiresIn);
        return { accessToken, expiresIn };
    }
    async rotateRefreshToken(rawRefreshToken, deviceId, ipAddress, userAgent) {
        const tokenHash = this.hashToken(rawRefreshToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: {
                user: {
                    include: {
                        roles: { include: { role: true } },
                    },
                },
            },
        });
        if (!stored) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (stored.revokedAt !== null) {
            this.logger.warn({ userId: stored.userId, tokenHash: tokenHash.slice(0, 8) + '...' }, 'Refresh token reuse detected — revoking all sessions');
            await this.revokeAllUserSessions(stored.userId);
            throw new common_1.UnauthorizedException('Session invalidated due to suspicious activity. Please log in again.');
        }
        if (stored.expiresAt < new Date()) {
            await this.revokeToken(stored.id);
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        await this.revokeToken(stored.id);
        const permissions = await this.getUserPermissions(stored.userId);
        const userWithPermissions = {
            id: stored.user.id,
            phone: stored.user.phone,
            email: stored.user.email,
            roles: stored.user.roles,
            permissions,
        };
        const storedAuthTime = stored.authTime
            ? Math.floor(stored.authTime.getTime() / 1000)
            : Math.floor(stored.createdAt.getTime() / 1000);
        return this.generateTokenPair(userWithPermissions, deviceId ?? stored.deviceId ?? undefined, stored.deviceName ?? undefined, ipAddress, userAgent, stored.rememberMe, storedAuthTime);
    }
    async revokeByRawToken(rawRefreshToken, expectedUserId) {
        const tokenHash = this.hashToken(rawRefreshToken);
        const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!record || record.revokedAt)
            return;
        if (expectedUserId && record.userId !== expectedUserId) {
            throw new common_1.ForbiddenException('Refresh token does not belong to this session');
        }
        await this.revokeToken(record.id);
    }
    async revokeAllUserSessions(userId) {
        const result = await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return result.count;
    }
    async getActiveSessions(userId) {
        return this.prisma.refreshToken.findMany({
            where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
            select: { id: true, deviceName: true, deviceId: true, createdAt: true, ipAddress: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async buildUserForToken(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: {
                roles: { include: { role: true } },
            },
        });
        const permissions = await this.getUserPermissions(userId);
        return {
            id: user.id,
            phone: user.phone,
            email: user.email,
            roles: user.roles,
            permissions,
        };
    }
    async resolveLiveRequestUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, phone: true, email: true, status: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.status === client_1.UserStatus.SUSPENDED || user.status === client_1.UserStatus.DELETED) {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        const built = await this.buildUserForToken(userId);
        const roleNames = built.roles.map((r) => r.role.name);
        if (roleNames.includes(client_1.RoleName.MERCHANT)) {
            const profile = await this.prisma.merchantProfile.findUnique({
                where: { userId },
                select: { isBlacklisted: true },
            });
            if (profile?.isBlacklisted) {
                throw new common_1.UnauthorizedException('Merchant account is restricted');
            }
        }
        return {
            id: user.id,
            phone: user.phone,
            email: user.email,
            roles: roleNames,
            permissions: built.permissions,
        };
    }
    async getUserPermissions(userId) {
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
        });
        const permSet = new Set();
        for (const ur of userRoles) {
            for (const rp of ur.role.permissions) {
                permSet.add(rp.permission.name);
            }
        }
        return Array.from(permSet);
    }
    hashToken(rawToken) {
        return (0, crypto_1.createHash)('sha256').update(rawToken).digest('hex');
    }
    async revokeToken(tokenId) {
        await this.prisma.refreshToken.update({
            where: { id: tokenId },
            data: { revokedAt: new Date() },
        });
    }
    parseExpirySeconds(expiry) {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match)
            return 900;
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 900;
        }
    }
    parseExpiryToDate(expiry) {
        return new Date(Date.now() + this.parseExpirySeconds(expiry) * 1000);
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = TokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        jwt_1.JwtService,
        config_1.ConfigService])
], TokenService);
//# sourceMappingURL=token.service.js.map