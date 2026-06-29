import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminCredentialSource,
  DomainEventType,
  KycStatus,
  Prisma,
  RoleName,
  StoreStatus,
  UserStatus,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS, REDIS_TTL } from '../../redis/redis.constants';
import { getConfig } from '../../config/configuration';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { TokenService } from '../auth/token.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { AdminPasswordService } from './admin-password.service';
import {
  AdminChangePasswordDto,
  AdminForgotPasswordDto,
  AdminLoginDto,
  AdminResetPasswordDto,
  UpdateAdminSettingsDto,
} from './dto/admin-auth.dto';

const ADMIN_ROLES: RoleName[] = [RoleName.ADMIN, RoleName.SUPER_ADMIN];

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokenService: TokenService,
    private readonly passwordService: AdminPasswordService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly emailNotifications: EmailNotificationService,
    configService: ConfigService,
  ) {
    this.cfg = getConfig(configService);
  }

  async login(dto: AdminLoginDto, ipAddress?: string, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    await this.enforceLoginRateLimit(email, ipAddress);

    const settings = await this.getSettings();
    let user = await this.findAdminUserByEmail(email);

    if (!user) {
      const hasAdmin = await this.hasAnyAdminUser();
      if (!hasAdmin) {
        user = await this.tryEnvBootstrap(email, dto.password);
      }
      if (!user) {
        await this.recordAudit(null, email, false, 'INVALID_CREDENTIALS', ipAddress, userAgent);
        throw new UnauthorizedException('Invalid email or password');
      }
    }

    const profile = user.adminProfile;
    if (!profile) {
      await this.recordAudit(user.id, email, false, 'NOT_ADMIN', ipAddress, userAgent);
      throw new ForbiddenException('Admin access required');
    }

    if (profile.lockedUntil && profile.lockedUntil > new Date()) {
      await this.recordAudit(user.id, email, false, 'ACCOUNT_LOCKED', ipAddress, userAgent);
      throw new ForbiddenException('Account locked due to too many failed attempts. Try again later.');
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      await this.recordAudit(user.id, email, false, 'ACCOUNT_DISABLED', ipAddress, userAgent);
      throw new ForbiddenException('Account is disabled');
    }

    const valid = await this.passwordService.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.recordFailedLogin(user.id, settings);
      await this.recordAudit(user.id, email, false, 'INVALID_CREDENTIALS', ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.adminProfile.update({
      where: { userId: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const isNewDevice = await this.isNewDeviceLogin(user.id, ipAddress, userAgent);
    const result = await this.issueTokens(user.id, {
      deviceName: dto.deviceName ?? 'admin-web',
      ipAddress,
      userAgent,
      rememberMe: dto.rememberMe ?? false,
      auditAction: 'ADMIN_LOGGED_IN',
      metadata: { email, loginMethod: 'password' },
    });

    await this.recordAudit(user.id, email, true, null, ipAddress, userAgent);

    if (isNewDevice && user.email) {
      void this.emailNotifications
        .sendAdminNewDeviceLogin(user.email, profile.name, ipAddress ?? 'Unknown')
        .catch((err) => this.logger.warn({ err }, 'New device email failed'));
    }

    return result;
  }

  async forgotPassword(dto: AdminForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.findAdminUserByEmail(email);
    if (!user?.email || !user.passwordHash) {
      return { message: 'If an admin account exists, a reset link has been sent' };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await this.redis.set(
      REDIS_KEYS.adminPasswordReset(tokenHash),
      user.id,
      REDIS_TTL.PASSWORD_RESET,
    );

    void this.emailNotifications
      .sendAdminPasswordResetEmail(email, rawToken, 15)
      .catch((err) => this.logger.error({ err, email }, 'Admin password reset email failed'));

    return { message: 'If an admin account exists, a reset link has been sent' };
  }

  async resetPassword(dto: AdminResetPasswordDto, ipAddress?: string) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const userId = await this.redis.get(REDIS_KEYS.adminPasswordReset(tokenHash));
    if (!userId) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    const user = await this.findAdminUserById(userId);
    if (!user) throw new BadRequestException('Invalid reset token');

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.adminProfile.update({
        where: { userId },
        data: { passwordChangedAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
      }),
    ]);

    await this.redis.del(REDIS_KEYS.adminPasswordReset(tokenHash));
    await this.tokenService.revokeAllUserSessions(userId);
    await this.revokeAllAdminSessions(userId);

    await this.audit.log({
      actorId: userId,
      action: 'ADMIN_PASSWORD_RESET',
      resourceType: 'admin_profile',
      resourceId: user.adminProfile!.id,
      ipAddress,
    });

    if (user.email) {
      void this.emailNotifications
        .sendAdminSecurityAlert(user.email, 'Your admin password was reset.')
        .catch(() => undefined);
    }

    return { message: 'Password updated successfully. Please sign in again.' };
  }

  async changePassword(userId: string, dto: AdminChangePasswordDto, ipAddress?: string) {
    const user = await this.findAdminUserById(userId);
    if (!user?.passwordHash) throw new BadRequestException('Password not set');

    const valid = await this.passwordService.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.adminProfile.update({
        where: { userId },
        data: { passwordChangedAt: new Date() },
      }),
    ]);

    await this.tokenService.revokeAllUserSessions(userId);
    await this.revokeAllAdminSessions(userId);

    await this.audit.log({
      actorId: userId,
      action: 'ADMIN_PASSWORD_CHANGED',
      resourceType: 'admin_profile',
      resourceId: user.adminProfile!.id,
      ipAddress,
    });

    if (user.email) {
      void this.emailNotifications
        .sendAdminSecurityAlert(user.email, 'Your admin password was changed.')
        .catch(() => undefined);
    }

    return { message: 'Password changed. All sessions have been logged out.' };
  }

  async getMe(userId: string) {
    const user = await this.findAdminUserById(userId);
    if (!user?.adminProfile) throw new UnauthorizedException('Not an admin user');
    return this.formatMe(user);
  }

  async getSettingsForUser(userId: string) {
    const user = await this.findAdminUserById(userId);
    if (!user?.adminProfile) throw new UnauthorizedException('Not an admin user');
    return {
      name: user.adminProfile.name,
      email: user.email,
      phone: user.adminProfile.phone ?? user.phone,
      department: user.adminProfile.department,
      credentialSource: user.adminProfile.credentialSource,
      lastLoginAt: user.adminProfile.lastLoginAt,
      passwordChangedAt: user.adminProfile.passwordChangedAt,
    };
  }

  async updateSettings(userId: string, dto: UpdateAdminSettingsDto, ipAddress?: string) {
    const user = await this.findAdminUserById(userId);
    if (!user?.adminProfile) throw new UnauthorizedException('Not an admin user');

    if (dto.email && dto.email.toLowerCase() !== user.email?.toLowerCase()) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (taken && taken.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.email) {
        await tx.user.update({
          where: { id: userId },
          data: { email: dto.email.toLowerCase(), emailVerified: true },
        });
      }
      await tx.adminProfile.update({
        where: { userId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.phone && { phone: dto.phone }),
        },
      });
    });

    await this.audit.log({
      actorId: userId,
      action: 'ADMIN_SETTINGS_UPDATED',
      resourceType: 'admin_profile',
      resourceId: user.adminProfile.id,
      ipAddress,
      metadata: dto as Prisma.InputJsonValue,
    });

    return this.getSettingsForUser(userId);
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.adminSession.findMany({
      where: { userId, revokedAt: null, loggedOutAt: null },
      orderBy: { lastActiveAt: 'desc' },
      include: {
        refreshToken: { select: { id: true, deviceName: true, ipAddress: true, expiresAt: true } },
      },
    });
    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName ?? s.refreshToken?.deviceName,
      ipAddress: s.ipAddress ?? s.refreshToken?.ipAddress,
      rememberMe: s.rememberMe,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      expiresAt: s.refreshToken?.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.adminSession.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
      include: { refreshToken: true },
    });
    if (!session) throw new BadRequestException('Session not found');

    if (session.refreshTokenId && session.refreshToken) {
      await this.prisma.refreshToken.update({
        where: { id: session.refreshTokenId },
        data: { revokedAt: new Date() },
      });
    }

    await this.prisma.adminSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), loggedOutAt: new Date() },
    });

    return { success: true };
  }

  async revokeAllSessions(userId: string, ipAddress?: string) {
    const count = await this.tokenService.revokeAllUserSessions(userId);
    await this.revokeAllAdminSessions(userId);
    await this.audit.log({
      actorId: userId,
      action: 'ADMIN_LOGOUT_ALL',
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
    });
    return { sessionsRevoked: count };
  }

  async logout(userId: string, rawRefreshToken?: string, ipAddress?: string) {
    if (rawRefreshToken) {
      await this.tokenService.revokeByRawToken(rawRefreshToken, userId);
      const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
      const rt = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
      if (rt) {
        await this.prisma.adminSession.updateMany({
          where: { refreshTokenId: rt.id, revokedAt: null },
          data: { revokedAt: new Date(), loggedOutAt: new Date() },
        });
      }
    }

    await this.audit.log({
      actorId: userId,
      action: 'ADMIN_LOGGED_OUT',
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
    });

    return { success: true };
  }

  async getLoginStats() {
    const [stores, orders, riders, merchants] = await Promise.all([
      this.prisma.store.count({ where: { status: StoreStatus.APPROVED } }),
      this.prisma.order.count(),
      this.prisma.riderProfile.count({ where: { kycStatus: KycStatus.APPROVED } }),
      this.prisma.merchantProfile.count(),
    ]);
    return {
      activeStores: stores,
      totalOrders: orders,
      activeRiders: riders,
      merchants,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async getSettings() {
    return (
      (await this.prisma.adminSettings.findUnique({ where: { id: 'default' } })) ?? {
        maxFailedAttempts: 10,
        lockoutMinutes: 30,
      }
    );
  }

  private async hasAnyAdminUser(): Promise<boolean> {
    const count = await this.prisma.adminProfile.count();
    return count > 0;
  }

  private async findAdminUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        roles: { some: { role: { name: { in: ADMIN_ROLES } } } },
      },
      include: {
        adminProfile: true,
        roles: { include: { role: true } },
      },
    });
  }

  private async findAdminUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: { some: { role: { name: { in: ADMIN_ROLES } } } },
      },
      include: {
        adminProfile: true,
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
  }

  private async tryEnvBootstrap(email: string, password: string) {
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envPassword = process.env.ADMIN_PASSWORD;
    const envName = process.env.ADMIN_NAME ?? 'Platform Admin';

    if (!envEmail || !envPassword) return null;
    if (email !== envEmail || password !== envPassword) return null;

    this.logger.warn('Bootstrapping admin account from ENV credentials');

    const adminRole = await this.prisma.role.findUnique({ where: { name: RoleName.SUPER_ADMIN } })
      ?? await this.prisma.role.findUnique({ where: { name: RoleName.ADMIN } });
    if (!adminRole) throw new BadRequestException('Admin role not configured');

    const passwordHash = await this.passwordService.hash(envPassword);
    const phone = `+910000${String(Date.now()).slice(-7)}`;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          phone,
          email: envEmail,
          passwordHash,
          status: UserStatus.ACTIVE,
          phoneVerified: true,
          emailVerified: true,
        },
      });

      await tx.userRole.create({ data: { userId: created.id, roleId: adminRole.id } });

      await tx.adminProfile.create({
        data: {
          userId: created.id,
          name: envName,
          credentialSource: AdminCredentialSource.ENV_BOOTSTRAP,
          isSuperAdmin: adminRole.name === RoleName.SUPER_ADMIN,
        },
      });

      return created;
    });

    void this.emailNotifications
      .sendAdminWelcomeEmail(envEmail, envName)
      .catch((err) => this.logger.warn({ err }, 'Admin welcome email failed'));

    return this.findAdminUserByEmail(envEmail);
  }

  private async recordFailedLogin(
    userId: string,
    settings: { maxFailedAttempts: number; lockoutMinutes: number },
  ) {
    const profile = await this.prisma.adminProfile.update({
      where: { userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });

    if (profile.failedLoginAttempts >= settings.maxFailedAttempts) {
      const lockedUntil = new Date(Date.now() + settings.lockoutMinutes * 60_000);
      await this.prisma.adminProfile.update({
        where: { userId },
        data: { lockedUntil },
      });
    }
  }

  private async recordAudit(
    userId: string | null,
    email: string,
    success: boolean,
    failureReason: string | null,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.adminLoginAudit.create({
      data: { userId, email, success, failureReason, ipAddress, userAgent },
    });
  }

  private async enforceLoginRateLimit(email: string, ipAddress?: string) {
    const key = `admin:login:${email}:${ipAddress ?? 'unknown'}`;
    const attempts = await this.redis.incr(key);
    if (attempts === 1) await this.redis.expire(key, 60 * 15);
    if (attempts > 20) {
      throw new ForbiddenException('Too many login attempts. Please try again later.');
    }
  }

  private async issueTokens(
    userId: string,
    opts: {
      deviceName?: string;
      ipAddress?: string;
      userAgent?: string;
      rememberMe: boolean;
      auditAction: string;
      metadata: Record<string, unknown>;
    },
  ) {
    const userForToken = await this.tokenService.buildUserForToken(userId);
    const tokens = await this.tokenService.generateTokenPair(
      userForToken,
      undefined,
      opts.deviceName,
      opts.ipAddress,
      opts.userAgent,
    );

    const tokenHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
    const refreshRecord = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (refreshRecord) {
      await this.prisma.adminSession.create({
        data: {
          userId,
          refreshTokenId: refreshRecord.id,
          ipAddress: opts.ipAddress,
          userAgent: opts.userAgent,
          deviceName: opts.deviceName,
          rememberMe: opts.rememberMe,
        },
      });
    }

    await Promise.all([
      this.audit.log({
        actorId: userId,
        action: opts.auditAction,
        resourceType: 'user',
        resourceId: userId,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
        metadata: opts.metadata as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.USER_LOGGED_IN,
        'user',
        userId,
        opts.metadata as Prisma.InputJsonValue,
        { userId, ipAddress: opts.ipAddress ?? null, userAgent: opts.userAgent ?? null },
      ),
    ]);

    const me = await this.getMe(userId);
    return { ...tokens, user: me };
  }

  private async revokeAllAdminSessions(userId: string) {
    await this.prisma.adminSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), loggedOutAt: new Date() },
    });
  }

  private async isNewDeviceLogin(userId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.adminLoginAudit.findFirst({
      where: {
        userId,
        success: true,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });
    return !existing;
  }

  private formatMe(user: NonNullable<Awaited<ReturnType<AdminAuthService['findAdminUserById']>>>) {
    const roles = user.roles.map((r) => r.role.name);
    const permSet = new Set<string>();
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        permSet.add(rp.permission.name);
      }
    }
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      status: user.status,
      phoneVerified: user.phoneVerified,
      roles,
      permissions: Array.from(permSet),
      createdAt: user.createdAt,
      adminProfile: user.adminProfile
        ? {
            name: user.adminProfile.name,
            department: user.adminProfile.department,
            isSuperAdmin: user.adminProfile.isSuperAdmin,
          }
        : null,
    };
  }
}
