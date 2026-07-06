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
var AdminAuthService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../database/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const redis_constants_1 = require("../../redis/redis.constants");
const configuration_1 = require("../../config/configuration");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const token_service_1 = require("../auth/token.service");
const email_notification_service_1 = require("../email/email-notification.service");
const admin_password_service_1 = require("./admin-password.service");
const ADMIN_ROLES = [client_1.RoleName.ADMIN, client_1.RoleName.SUPER_ADMIN];
let AdminAuthService = AdminAuthService_1 = class AdminAuthService {
    constructor(prisma, redis, tokenService, passwordService, audit, domainEvents, emailNotifications, configService) {
        this.prisma = prisma;
        this.redis = redis;
        this.tokenService = tokenService;
        this.passwordService = passwordService;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.emailNotifications = emailNotifications;
        this.logger = new common_1.Logger(AdminAuthService_1.name);
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    async login(dto, ipAddress, userAgent) {
        const email = dto.email.trim().toLowerCase();
        await this.enforceLoginRateLimit(email, ipAddress);
        const settings = await this.getSettings();
        let user = await this.findAdminUserByEmail(email);
        if (!user) {
            user = await this.tryEnvBootstrap(email, dto.password);
            if (!user) {
                await this.recordAudit(null, email, false, 'INVALID_CREDENTIALS', ipAddress, userAgent);
                throw new common_1.UnauthorizedException('Invalid email or password');
            }
        }
        const profile = user.adminProfile;
        if (!profile) {
            await this.recordAudit(user.id, email, false, 'NOT_ADMIN', ipAddress, userAgent);
            throw new common_1.ForbiddenException('Admin access required');
        }
        if (profile.lockedUntil && profile.lockedUntil > new Date()) {
            await this.recordAudit(user.id, email, false, 'ACCOUNT_LOCKED', ipAddress, userAgent);
            throw new common_1.ForbiddenException('Account locked due to too many failed attempts. Try again later.');
        }
        if (user.status === client_1.UserStatus.SUSPENDED || user.status === client_1.UserStatus.DELETED) {
            await this.recordAudit(user.id, email, false, 'ACCOUNT_DISABLED', ipAddress, userAgent);
            throw new common_1.ForbiddenException('Account is disabled');
        }
        const valid = await this.passwordService.verify(user.passwordHash, dto.password);
        if (!valid) {
            await this.recordFailedLogin(user.id, settings);
            await this.recordAudit(user.id, email, false, 'INVALID_CREDENTIALS', ipAddress, userAgent);
            throw new common_1.UnauthorizedException('Invalid email or password');
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
    async forgotPassword(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.findAdminUserByEmail(email);
        if (!user?.email || !user.passwordHash) {
            return { message: 'If an admin account exists, a reset link has been sent' };
        }
        const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(rawToken).digest('hex');
        await this.redis.set(redis_constants_1.REDIS_KEYS.adminPasswordReset(tokenHash), user.id, redis_constants_1.REDIS_TTL.PASSWORD_RESET);
        void this.emailNotifications
            .sendAdminPasswordResetEmail(email, rawToken, 15)
            .catch((err) => this.logger.error({ err, email }, 'Admin password reset email failed'));
        return { message: 'If an admin account exists, a reset link has been sent' };
    }
    async resetPassword(dto, ipAddress) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(dto.token).digest('hex');
        const userId = await this.redis.get(redis_constants_1.REDIS_KEYS.adminPasswordReset(tokenHash));
        if (!userId) {
            throw new common_1.BadRequestException('Reset link is invalid or expired');
        }
        const user = await this.findAdminUserById(userId);
        if (!user)
            throw new common_1.BadRequestException('Invalid reset token');
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
        await this.redis.del(redis_constants_1.REDIS_KEYS.adminPasswordReset(tokenHash));
        await this.tokenService.revokeAllUserSessions(userId);
        await this.revokeAllAdminSessions(userId);
        await this.audit.log({
            actorId: userId,
            action: 'ADMIN_PASSWORD_RESET',
            resourceType: 'admin_profile',
            resourceId: user.adminProfile.id,
            ipAddress,
        });
        if (user.email) {
            void this.emailNotifications
                .sendAdminSecurityAlert(user.email, 'Your admin password was reset.')
                .catch(() => undefined);
        }
        return { message: 'Password updated successfully. Please sign in again.' };
    }
    async changePassword(userId, dto, ipAddress) {
        const user = await this.findAdminUserById(userId);
        if (!user?.passwordHash)
            throw new common_1.BadRequestException('Password not set');
        const valid = await this.passwordService.verify(user.passwordHash, dto.currentPassword);
        if (!valid)
            throw new common_1.UnauthorizedException('Current password is incorrect');
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
            resourceId: user.adminProfile.id,
            ipAddress,
        });
        if (user.email) {
            void this.emailNotifications
                .sendAdminSecurityAlert(user.email, 'Your admin password was changed.')
                .catch(() => undefined);
        }
        return { message: 'Password changed. All sessions have been logged out.' };
    }
    async getMe(userId) {
        const user = await this.findAdminUserById(userId);
        if (!user?.adminProfile)
            throw new common_1.UnauthorizedException('Not an admin user');
        return this.formatMe(user);
    }
    async getSettingsForUser(userId) {
        const user = await this.findAdminUserById(userId);
        if (!user?.adminProfile)
            throw new common_1.UnauthorizedException('Not an admin user');
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
    async updateSettings(userId, dto, ipAddress) {
        const user = await this.findAdminUserById(userId);
        if (!user?.adminProfile)
            throw new common_1.UnauthorizedException('Not an admin user');
        if (dto.email && dto.email.toLowerCase() !== user.email?.toLowerCase()) {
            const taken = await this.prisma.user.findUnique({
                where: { email: dto.email.toLowerCase() },
            });
            if (taken && taken.id !== userId) {
                throw new common_1.BadRequestException('Email already in use');
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
            metadata: dto,
        });
        return this.getSettingsForUser(userId);
    }
    async listSessions(userId) {
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
    async revokeSession(userId, sessionId) {
        const session = await this.prisma.adminSession.findFirst({
            where: { id: sessionId, userId, revokedAt: null },
            include: { refreshToken: true },
        });
        if (!session)
            throw new common_1.BadRequestException('Session not found');
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
    async revokeAllSessions(userId, ipAddress) {
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
    async logout(userId, rawRefreshToken, ipAddress) {
        if (rawRefreshToken) {
            await this.tokenService.revokeByRawToken(rawRefreshToken, userId);
            const tokenHash = (0, crypto_1.createHash)('sha256').update(rawRefreshToken).digest('hex');
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
            this.prisma.store.count({ where: { status: client_1.StoreStatus.APPROVED } }),
            this.prisma.order.count(),
            this.prisma.riderProfile.count({ where: { kycStatus: client_1.KycStatus.APPROVED } }),
            this.prisma.merchantProfile.count(),
        ]);
        return {
            activeStores: stores,
            totalOrders: orders,
            activeRiders: riders,
            merchants,
        };
    }
    async getSettings() {
        return ((await this.prisma.adminSettings.findUnique({ where: { id: 'default' } })) ?? {
            maxFailedAttempts: 10,
            lockoutMinutes: 30,
        });
    }
    async hasAnyAdminUser() {
        const count = await this.prisma.adminProfile.count();
        return count > 0;
    }
    async findAdminUserByEmail(email) {
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
    async findAdminUserById(userId) {
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
    async tryEnvBootstrap(email, password) {
        const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const envPassword = process.env.ADMIN_PASSWORD;
        const envName = process.env.ADMIN_NAME ?? 'Platform Admin';
        if (!envEmail || !envPassword)
            return null;
        if (email !== envEmail || password !== envPassword)
            return null;
        this.logger.warn('Bootstrapping admin account from ENV credentials');
        const adminRole = await this.prisma.role.findUnique({ where: { name: client_1.RoleName.SUPER_ADMIN } })
            ?? await this.prisma.role.findUnique({ where: { name: client_1.RoleName.ADMIN } });
        if (!adminRole)
            throw new common_1.BadRequestException('Admin role not configured');
        const passwordHash = await this.passwordService.hash(envPassword);
        const phone = `+910000${String(Date.now()).slice(-7)}`;
        const user = await this.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    phone,
                    email: envEmail,
                    passwordHash,
                    status: client_1.UserStatus.ACTIVE,
                    phoneVerified: true,
                    emailVerified: true,
                },
            });
            await tx.userRole.create({ data: { userId: created.id, roleId: adminRole.id } });
            await tx.adminProfile.create({
                data: {
                    userId: created.id,
                    name: envName,
                    credentialSource: client_1.AdminCredentialSource.ENV_BOOTSTRAP,
                    isSuperAdmin: adminRole.name === client_1.RoleName.SUPER_ADMIN,
                },
            });
            return created;
        });
        void this.emailNotifications
            .sendAdminWelcomeEmail(envEmail, envName)
            .catch((err) => this.logger.warn({ err }, 'Admin welcome email failed'));
        return this.findAdminUserByEmail(envEmail);
    }
    async recordFailedLogin(userId, settings) {
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
    async recordAudit(userId, email, success, failureReason, ipAddress, userAgent) {
        await this.prisma.adminLoginAudit.create({
            data: { userId, email, success, failureReason, ipAddress, userAgent },
        });
    }
    async enforceLoginRateLimit(email, ipAddress) {
        const key = `admin:login:${email}:${ipAddress ?? 'unknown'}`;
        const attempts = await this.redis.incr(key);
        if (attempts === 1)
            await this.redis.expire(key, 60 * 15);
        if (attempts > 20) {
            throw new common_1.ForbiddenException('Too many login attempts. Please try again later.');
        }
    }
    async issueTokens(userId, opts) {
        const userForToken = await this.tokenService.buildUserForToken(userId);
        const tokens = await this.tokenService.generateTokenPair(userForToken, undefined, opts.deviceName, opts.ipAddress, opts.userAgent, opts.rememberMe);
        const tokenHash = (0, crypto_1.createHash)('sha256').update(tokens.refreshToken).digest('hex');
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
                metadata: opts.metadata,
            }),
            this.domainEvents.emit(client_1.DomainEventType.USER_LOGGED_IN, 'user', userId, opts.metadata, { userId, ipAddress: opts.ipAddress ?? null, userAgent: opts.userAgent ?? null }),
        ]);
        const me = await this.getMe(userId);
        return { ...tokens, user: me };
    }
    async revokeAllAdminSessions(userId) {
        await this.prisma.adminSession.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date(), loggedOutAt: new Date() },
        });
    }
    async isNewDeviceLogin(userId, ipAddress, userAgent) {
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
    formatMe(user) {
        const roles = user.roles.map((r) => r.role.name);
        const permSet = new Set();
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
};
exports.AdminAuthService = AdminAuthService;
exports.AdminAuthService = AdminAuthService = AdminAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        token_service_1.TokenService,
        admin_password_service_1.AdminPasswordService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        email_notification_service_1.EmailNotificationService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], AdminAuthService);
//# sourceMappingURL=admin-auth.service.js.map