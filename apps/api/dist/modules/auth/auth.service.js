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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.isBuyerFullyVerified = isBuyerFullyVerified;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const secure_random_util_1 = require("../../common/utils/secure-random.util");
const configuration_1 = require("../../config/configuration");
const auth_constants_1 = require("./auth.constants");
const prisma_service_1 = require("../../database/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const redis_constants_1 = require("../../redis/redis.constants");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const verification_blocklist_service_1 = require("../merchant/verification-blocklist.service");
const trust_safety_hook_service_1 = require("../trust-safety/trust-safety-hook.service");
const risk_engine_service_1 = require("../trust-safety/risk-engine.service");
const referral_service_1 = require("../wallet-loyalty/referral.service");
const wallet_service_1 = require("../wallet-loyalty/wallet.service");
const email_notification_service_1 = require("../email/email-notification.service");
const otp_service_1 = require("./otp.service");
const password_service_1 = require("./password.service");
const token_service_1 = require("./token.service");
function isBuyerFullyVerified(input) {
    return (Boolean(input.name?.trim()) &&
        Boolean(input.phone?.trim()) &&
        Boolean(input.email?.trim()) &&
        input.phoneVerified &&
        input.emailVerified);
}
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, otpService, tokenService, passwordService, wallet, referral, riskEngine, redis, auditService, domainEvents, blocklist, trustSafety, emailNotifications, configService) {
        this.prisma = prisma;
        this.otpService = otpService;
        this.tokenService = tokenService;
        this.passwordService = passwordService;
        this.wallet = wallet;
        this.referral = referral;
        this.riskEngine = riskEngine;
        this.redis = redis;
        this.auditService = auditService;
        this.domainEvents = domainEvents;
        this.blocklist = blocklist;
        this.trustSafety = trustSafety;
        this.emailNotifications = emailNotifications;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    assertEmailAuthEnabled() {
        if (!this.cfg.auth.emailEnabled) {
            throw new common_1.ServiceUnavailableException('Email authentication is temporarily unavailable.');
        }
    }
    assertPhoneOtpEnabled() {
        if (!this.cfg.auth.phoneOtpEnabled) {
            throw new common_1.ServiceUnavailableException(auth_constants_1.MOBILE_OTP_DISABLED_MESSAGE);
        }
    }
    async requestOtp(dto, ipAddress, userAgent) {
        const viaEmail = Boolean(dto.email?.trim());
        if (!dto.phone && !dto.email?.trim()) {
            throw new common_1.BadRequestException('Phone or email is required');
        }
        if (viaEmail) {
            this.assertEmailAuthEnabled();
        }
        else {
            this.assertPhoneOtpEnabled();
        }
        let phone;
        let user = null;
        if (viaEmail) {
            const email = dto.email.trim().toLowerCase();
            await this.blocklist.assertNotBlocked({ email });
            user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new common_1.NotFoundException('No account found with this email');
            }
            phone = user.phone;
        }
        else {
            phone = dto.phone;
            await this.blocklist.assertNotBlocked({ phone });
            user = await this.prisma.user.findUnique({ where: { phone } });
        }
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    phone,
                    status: client_1.UserStatus.PENDING_VERIFICATION,
                    phoneVerified: false,
                },
            });
            this.logger.debug({ userId: user.id, phone }, 'New user created for OTP');
        }
        if (user.status === client_1.UserStatus.SUSPENDED || user.status === client_1.UserStatus.DELETED) {
            throw new common_1.ForbiddenException('Account is not active');
        }
        await this.blocklist.assertUserNotBlacklisted(user.id);
        const purpose = user.phoneVerified ? client_1.OtpPurpose.LOGIN : client_1.OtpPurpose.REGISTRATION;
        const skipSms = viaEmail || !this.cfg.auth.smsEnabled || !this.cfg.auth.phoneOtpEnabled;
        const { expiresIn, code } = await this.otpService.requestOtp(phone, purpose, user.id, {
            skipSms,
        });
        const emailRecipient = viaEmail
            ? dto.email.trim().toLowerCase()
            : user.email?.trim().toLowerCase();
        if (emailRecipient && code) {
            void this.emailNotifications
                .sendOtpEmail(emailRecipient, code, expiresIn)
                .catch((err) => this.logger.error({ err, emailRecipient }, 'OTP email failed'));
        }
        void this.trustSafety.onOtpRequest(phone, ipAddress, dto.deviceId, userAgent).catch(() => { });
        await this.domainEvents.emit(client_1.DomainEventType.OTP_REQUESTED, 'user', user.id, { phone, purpose: purpose, viaEmail }, { ipAddress: ipAddress ?? null });
        return {
            message: viaEmail
                ? 'OTP sent to your email'
                : 'OTP sent successfully',
            expiresIn,
            phone: viaEmail ? phone : undefined,
        };
    }
    async verifyOtp(dto, ipAddress, userAgent) {
        const { phone, code, deviceId, deviceName } = dto;
        const user = await this.prisma.user.findUnique({
            where: { phone },
            include: { roles: { include: { role: true } } },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found. Please request an OTP first.');
        }
        if (user.status === client_1.UserStatus.SUSPENDED || user.status === client_1.UserStatus.DELETED) {
            throw new common_1.ForbiddenException('Account is not active');
        }
        const purpose = user.phoneVerified ? client_1.OtpPurpose.LOGIN : client_1.OtpPurpose.REGISTRATION;
        await this.otpService.verifyOtp(phone, code, purpose);
        const isNewUser = !user.phoneVerified;
        if (isNewUser) {
            await this.registerNewBuyer(user.id, {
                name: dto.name?.trim() || phone,
                phone,
                referralCode: dto.referralCode,
                deviceId,
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }
        const refreshedUser = await this.tokenService.buildUserForToken(user.id);
        const tokens = await this.tokenService.generateTokenPair(refreshedUser, deviceId, deviceName, ipAddress, userAgent);
        void this.trustSafety.onOtpVerified(user.id, {
            deviceId,
            ipAddress,
            userAgent,
            fingerprint: deviceId,
        }).catch(() => { });
        const eventType = isNewUser ? client_1.DomainEventType.USER_REGISTERED : client_1.DomainEventType.USER_LOGGED_IN;
        await Promise.all([
            this.auditService.log({
                actorId: user.id,
                action: isNewUser ? 'USER_REGISTERED' : 'USER_LOGGED_IN',
                resourceType: 'user',
                resourceId: user.id,
                ipAddress,
                userAgent,
                metadata: { phone, deviceId: deviceId ?? null },
            }),
            this.domainEvents.emit(eventType, 'user', user.id, { phone, isNewUser, deviceId: deviceId ?? null }, { userId: user.id, ipAddress: ipAddress ?? null, userAgent: userAgent ?? null }),
            this.domainEvents.emit(client_1.DomainEventType.OTP_VERIFIED, 'user', user.id, { phone, purpose: purpose }, { ipAddress: ipAddress ?? null }),
        ]);
        const me = await this.getMe(user.id);
        if (isNewUser) {
            void this.sendWelcomeEmailIfPossible(user.id, dto.name?.trim()).catch((err) => this.logger.error({ err, userId: user.id }, 'Welcome email failed'));
        }
        return { ...tokens, user: me, isNewUser };
    }
    async signup(dto, ipAddress, userAgent) {
        this.assertEmailAuthEnabled();
        const email = dto.email.trim().toLowerCase();
        await this.blocklist.assertNotBlocked({ email });
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const phone = await this.generatePlaceholderPhone();
        const passwordHash = await this.passwordService.hash(dto.password);
        const user = await this.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    email,
                    phone,
                    passwordHash,
                    status: client_1.UserStatus.PENDING_VERIFICATION,
                    emailVerified: false,
                    phoneVerified: false,
                },
            });
            await this.applyBuyerRegistration(created.id, {
                name: dto.name.trim(),
                phone,
                emailVerified: true,
                verifyPhone: false,
            }, tx);
            return created;
        });
        const buyerProfile = await this.prisma.buyerProfile.findUniqueOrThrow({
            where: { userId: user.id },
        });
        await this.finalizeBuyerRegistration(user.id, buyerProfile.id, {
            referralCode: dto.referralCode,
            deviceId: dto.deviceId,
            phone,
        });
        return this.completeAuthentication(user.id, {
            isNewUser: true,
            deviceId: dto.deviceId,
            deviceName: dto.deviceName,
            ipAddress,
            userAgent,
            auditAction: 'USER_REGISTERED',
            metadata: { email, signupMethod: 'email' },
        }).then(async (result) => {
            void this.emailNotifications
                .sendWelcomeEmail(email, dto.name.trim())
                .catch((err) => this.logger.error({ err, email }, 'Welcome email failed'));
            return result;
        });
    }
    async login(dto, ipAddress, userAgent) {
        this.assertEmailAuthEnabled();
        const email = dto.email.trim().toLowerCase();
        await this.blocklist.assertNotBlocked({ email });
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.status === client_1.UserStatus.SUSPENDED || user.status === client_1.UserStatus.DELETED) {
            throw new common_1.ForbiddenException('Account is not active');
        }
        await this.blocklist.assertUserNotBlacklisted(user.id);
        const valid = await this.passwordService.verify(user.passwordHash, dto.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        return this.completeAuthentication(user.id, {
            isNewUser: false,
            deviceId: dto.deviceId,
            deviceName: dto.deviceName,
            ipAddress,
            userAgent,
            auditAction: 'USER_LOGGED_IN',
            metadata: { email, loginMethod: 'email' },
        });
    }
    async forgotPassword(dto) {
        if (dto.email) {
            this.assertEmailAuthEnabled();
            const email = dto.email.trim().toLowerCase();
            await this.blocklist.assertNotBlocked({ email });
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                return { message: 'If an account exists, a reset link has been sent to your email' };
            }
            if (!user.passwordHash) {
                throw new common_1.BadRequestException('This account uses mobile OTP login. Reset via mobile instead.');
            }
            const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
            const tokenHash = (0, crypto_1.createHash)('sha256').update(rawToken).digest('hex');
            await this.redis.set(redis_constants_1.REDIS_KEYS.passwordReset(tokenHash), user.id, redis_constants_1.REDIS_TTL.PASSWORD_RESET);
            void this.emailNotifications
                .sendPasswordResetEmail(email, rawToken, Math.round(redis_constants_1.REDIS_TTL.PASSWORD_RESET / 60))
                .catch((err) => this.logger.error({ err, email }, 'Password reset email failed'));
            return { message: 'If an account exists, a reset link has been sent to your email' };
        }
        if (dto.phone) {
            this.assertPhoneOtpEnabled();
            const phone = dto.phone;
            await this.blocklist.assertNotBlocked({ phone });
            const user = await this.prisma.user.findUnique({ where: { phone } });
            if (!user) {
                return { message: 'OTP sent if an account exists for this number', expiresIn: 300 };
            }
            if (user.status === client_1.UserStatus.SUSPENDED || user.status === client_1.UserStatus.DELETED) {
                throw new common_1.ForbiddenException('Account is not active');
            }
            const { expiresIn } = await this.otpService.requestOtp(phone, client_1.OtpPurpose.PASSWORD_RESET, user.id);
            return { message: 'OTP sent to your mobile number', expiresIn, phone };
        }
        throw new common_1.BadRequestException('Email or phone is required');
    }
    async resetPassword(dto) {
        let userId = null;
        if (dto.token) {
            const tokenHash = (0, crypto_1.createHash)('sha256').update(dto.token).digest('hex');
            userId = await this.redis.get(redis_constants_1.REDIS_KEYS.passwordReset(tokenHash));
            if (!userId) {
                throw new common_1.BadRequestException('Invalid or expired reset link. Please request a new one.');
            }
            await this.redis.del(redis_constants_1.REDIS_KEYS.passwordReset(tokenHash));
        }
        else if (dto.phone && dto.code) {
            this.assertPhoneOtpEnabled();
            await this.otpService.verifyOtp(dto.phone, dto.code, client_1.OtpPurpose.PASSWORD_RESET);
            const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            userId = user.id;
        }
        else {
            throw new common_1.BadRequestException('Provide a reset token or mobile OTP');
        }
        const passwordHash = await this.passwordService.hash(dto.newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        await this.tokenService.revokeAllUserSessions(userId);
        return { message: 'Password updated successfully. Please log in with your new password.' };
    }
    async refresh(dto, ipAddress, userAgent) {
        return this.tokenService.rotateRefreshToken(dto.refreshToken, dto.deviceId, ipAddress, userAgent);
    }
    async logout(userId, rawRefreshToken, ipAddress, userAgent) {
        if (rawRefreshToken) {
            await this.tokenService.revokeByRawToken(rawRefreshToken, userId);
        }
        await Promise.all([
            this.auditService.log({
                actorId: userId,
                action: 'USER_LOGGED_OUT',
                resourceType: 'user',
                resourceId: userId,
                ipAddress,
                userAgent,
            }),
            this.domainEvents.emit(client_1.DomainEventType.USER_LOGGED_OUT, 'user', userId, { singleDevice: true }, { userId, ipAddress: ipAddress ?? null }),
        ]);
    }
    async logoutAll(userId, ipAddress, userAgent) {
        const sessionsRevoked = await this.tokenService.revokeAllUserSessions(userId);
        await Promise.all([
            this.auditService.log({
                actorId: userId,
                action: 'USER_LOGGED_OUT_ALL',
                resourceType: 'user',
                resourceId: userId,
                ipAddress,
                userAgent,
                metadata: { sessionsRevoked },
            }),
            this.domainEvents.emit(client_1.DomainEventType.USER_LOGGED_OUT, 'user', userId, { allDevices: true, sessionsRevoked }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        return { sessionsRevoked };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                buyerProfile: { select: { name: true } },
                roles: {
                    include: {
                        role: {
                            include: { permissions: { include: { permission: true } } },
                        },
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const roles = user.roles.map((r) => r.role.name);
        const name = user.buyerProfile?.name ?? null;
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
            name,
            status: user.status,
            phoneVerified: user.phoneVerified,
            emailVerified: user.emailVerified,
            isVerified: isBuyerFullyVerified({
                name,
                phone: user.phone,
                email: user.email,
                phoneVerified: user.phoneVerified,
                emailVerified: user.emailVerified,
            }),
            roles,
            permissions: Array.from(permSet),
            createdAt: user.createdAt,
        };
    }
    async resolveBuyerRole(client = this.prisma) {
        const buyerRole = await client.role.findUnique({ where: { name: client_1.RoleName.BUYER } });
        if (!buyerRole) {
            throw new common_1.ServiceUnavailableException('Buyer signup is temporarily unavailable. Please contact support.');
        }
        return buyerRole;
    }
    async ensureBuyerAccess(userId, opts) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                buyerProfile: true,
                roles: { include: { role: true } },
            },
        });
        if (!user)
            return;
        const hasBuyerRole = user.roles.some((r) => r.role.name === client_1.RoleName.BUYER);
        if (hasBuyerRole && user.buyerProfile)
            return;
        await this.registerNewBuyer(userId, {
            name: opts?.name ?? user.buyerProfile?.name ?? user.email?.split('@')[0] ?? user.phone,
            phone: user.phone,
            referralCode: opts?.referralCode,
            deviceId: opts?.deviceId,
            emailVerified: opts?.emailVerified ?? user.emailVerified,
            verifyPhone: opts?.verifyPhone ?? user.phoneVerified,
        });
    }
    async registerNewBuyer(userId, opts) {
        const buyerProfile = await this.prisma.$transaction(async (tx) => this.applyBuyerRegistration(userId, opts, tx));
        await this.finalizeBuyerRegistration(userId, buyerProfile.id, opts);
        this.logger.log({ userId, phone: opts.phone }, 'New buyer registered and activated');
    }
    async applyBuyerRegistration(userId, opts, tx) {
        const buyerRole = await this.resolveBuyerRole(tx);
        const existing = await tx.user.findUnique({
            where: { id: userId },
            include: {
                buyerProfile: true,
                roles: { include: { role: true } },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        const hasBuyerRole = existing.roles.some((r) => r.role.name === client_1.RoleName.BUYER);
        await tx.user.update({
            where: { id: userId },
            data: {
                status: client_1.UserStatus.ACTIVE,
                phoneVerified: opts.verifyPhone ?? true,
                lastLoginAt: new Date(),
                ...(opts.emailVerified !== undefined ? { emailVerified: opts.emailVerified } : {}),
            },
        });
        const profile = existing.buyerProfile ??
            (await tx.buyerProfile.create({
                data: {
                    userId,
                    name: opts.name,
                },
            }));
        if (!hasBuyerRole) {
            await tx.userRole.upsert({
                where: {
                    userId_roleId: { userId, roleId: buyerRole.id },
                },
                update: {},
                create: { userId, roleId: buyerRole.id },
            });
        }
        await tx.notificationPreference.upsert({
            where: { userId },
            create: { userId },
            update: {},
        });
        return profile;
    }
    async finalizeBuyerRegistration(userId, buyerProfileId, opts) {
        await this.riskEngine.getOrCreateProfile(userId);
        await this.wallet.getOrCreateWallet(buyerProfileId);
        if (opts.referralCode?.trim()) {
            try {
                await this.referral.applyReferralCode(buyerProfileId, opts.referralCode.trim(), opts.deviceId);
            }
            catch (err) {
                this.logger.warn({ userId, referralCode: opts.referralCode, err }, 'Referral apply failed at signup');
            }
        }
    }
    async completeAuthentication(userId, opts) {
        await this.ensureBuyerAccess(userId);
        const refreshedUser = await this.tokenService.buildUserForToken(userId);
        const tokens = await this.tokenService.generateTokenPair(refreshedUser, opts.deviceId, opts.deviceName, opts.ipAddress, opts.userAgent);
        const eventType = opts.isNewUser ? client_1.DomainEventType.USER_REGISTERED : client_1.DomainEventType.USER_LOGGED_IN;
        await Promise.all([
            this.auditService.log({
                actorId: userId,
                action: opts.auditAction,
                resourceType: 'user',
                resourceId: userId,
                ipAddress: opts.ipAddress,
                userAgent: opts.userAgent,
                metadata: opts.metadata,
            }),
            this.domainEvents.emit(eventType, 'user', userId, { ...opts.metadata, isNewUser: opts.isNewUser, deviceId: opts.deviceId ?? null }, {
                userId,
                ipAddress: opts.ipAddress ?? null,
                userAgent: opts.userAgent ?? null,
            }),
        ]);
        const me = await this.getMe(userId);
        return { ...tokens, user: me, isNewUser: opts.isNewUser };
    }
    async generatePlaceholderPhone() {
        for (let i = 0; i < 10; i++) {
            const suffix = String((0, secure_random_util_1.secureRandomInt)(1_000_000, 9_999_999));
            const phone = `+910000${suffix}`;
            const exists = await this.prisma.user.findUnique({ where: { phone } });
            if (!exists)
                return phone;
        }
        throw new common_1.BadRequestException('Unable to create account. Please try again.');
    }
    async sendWelcomeEmailIfPossible(userId, preferredName) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { buyerProfile: { select: { name: true } } },
        });
        if (!user?.email)
            return;
        const name = preferredName || user.buyerProfile?.name || 'there';
        await this.emailNotifications.sendWelcomeEmail(user.email, name);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        otp_service_1.OtpService,
        token_service_1.TokenService,
        password_service_1.PasswordService,
        wallet_service_1.WalletService,
        referral_service_1.ReferralService,
        risk_engine_service_1.RiskEngineService,
        redis_service_1.RedisService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        verification_blocklist_service_1.VerificationBlocklistService,
        trust_safety_hook_service_1.TrustSafetyHookService,
        email_notification_service_1.EmailNotificationService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map