import { ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleName, UserStatus } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS } from '../../redis/redis.constants';
import { getConfig } from '../../config/configuration';
import { RequestUser } from '../../common/types';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TokenPair } from './interfaces/token-pair.interface';

interface UserForToken {
  id: string;
  phone: string;
  email: string | null;
  roles: Array<{ role: { name: string } }>;
  permissions: string[];
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.cfg = getConfig(configService);
  }

  /**
   * Issue a new access token + refresh token pair for a user.
   * The refresh token is stored as SHA-256 hash in the database.
   */
  async generateTokenPair(
    user: UserForToken,
    deviceId?: string,
    deviceName?: string,
    ipAddress?: string,
    userAgent?: string,
    rememberMe = false,
    authTime?: number,
  ): Promise<TokenPair> {
    const roles = user.roles.map((r) => r.role.name);
    const permissions = user.permissions;

    const actualAuthTime = authTime ?? Math.floor(Date.now() / 1000);

    const payload: JwtPayload = {
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

    // Parse expiry seconds from string like "15m", "1h", "30d"
    const expiresIn = this.parseExpirySeconds(this.cfg.jwt.accessExpiresIn);

    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiryStr = rememberMe ? '30d' : '1d';
    const refreshExpiresAt = this.parseExpiryToDate(refreshExpiryStr);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceId: deviceId ?? uuidv4(),
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

  /**
   * Generate a step-up token for sensitive actions.
   */
  async generateStepUpToken(userId: string): Promise<{ accessToken: string; expiresIn: number }> {
    const user = await this.buildUserForToken(userId);
    const roles = user.roles.map((r) => r.role.name);
    const permissions = user.permissions;

    const payload: JwtPayload = {
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

  /**
   * Rotate refresh tokens — verify → revoke old → issue new pair.
   * Implements reuse detection: if a revoked token is presented, revoke ALL sessions.
   */
  async rotateRefreshToken(
    rawRefreshToken: string,
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
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

    // Unknown token
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // REUSE DETECTION: token was already revoked → possible theft → wipe all sessions
    if (stored.revokedAt !== null) {
      this.logger.warn(
        { userId: stored.userId, tokenHash: tokenHash.slice(0, 8) + '...' },
        'Refresh token reuse detected — revoking all sessions',
      );
      await this.revokeAllUserSessions(stored.userId);
      throw new UnauthorizedException(
        'Session invalidated due to suspicious activity. Please log in again.',
      );
    }

    // Expired
    if (stored.expiresAt < new Date()) {
      await this.revokeToken(stored.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke the used token
    await this.revokeToken(stored.id);

    // Gather permissions fresh from DB
    const permissions = await this.getUserPermissions(stored.userId);

    const userWithPermissions: UserForToken = {
      id: stored.user.id,
      phone: stored.user.phone,
      email: stored.user.email,
      roles: stored.user.roles,
      permissions,
    };

    const storedAuthTime = stored.authTime
      ? Math.floor(stored.authTime.getTime() / 1000)
      : Math.floor(stored.createdAt.getTime() / 1000);

    return this.generateTokenPair(
      userWithPermissions,
      deviceId ?? stored.deviceId ?? undefined,
      stored.deviceName ?? undefined,
      ipAddress,
      userAgent,
      stored.rememberMe,
      storedAuthTime,
    );
  }

  /**
   * Revoke a single refresh token (logout from one device).
   */
  async revokeByRawToken(rawRefreshToken: string, expectedUserId?: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.revokedAt) return;
    if (expectedUserId && record.userId !== expectedUserId) {
      throw new ForbiddenException('Refresh token does not belong to this session');
    }
    await this.revokeToken(record.id);
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices).
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  /**
   * List active sessions (non-revoked, non-expired) for a user.
   */
  async getActiveSessions(
    userId: string,
  ): Promise<Array<{ id: string; deviceName: string | null; deviceId: string | null; createdAt: Date; ipAddress: string | null }>> {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, deviceName: true, deviceId: true, createdAt: true, ipAddress: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Build the full user object needed to sign a token (inc. permissions)
  // ---------------------------------------------------------------------------

  async buildUserForToken(userId: string): Promise<UserForToken> {
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

  /** Fresh roles/permissions + account status for JWT guard (blocks stale suspended tokens). */
  async resolveLiveRequestUser(userId: string): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, email: true, status: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Account is not active');
    }

    const built = await this.buildUserForToken(userId);
    const roleNames = built.roles.map((r) => r.role.name);

    if (roleNames.includes(RoleName.MERCHANT)) {
      const profile = await this.prisma.merchantProfile.findUnique({
        where: { userId },
        select: { isBlacklisted: true },
      });
      if (profile?.isBlacklisted) {
        throw new UnauthorizedException('Merchant account is restricted');
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

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const permSet = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
        permSet.add(rp.permission.name);
      }
    }
    return Array.from(permSet);
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private async revokeToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  private parseExpirySeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // 15 min default
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

  private parseExpiryToDate(expiry: string): Date {
    return new Date(Date.now() + this.parseExpirySeconds(expiry) * 1000);
  }
}
