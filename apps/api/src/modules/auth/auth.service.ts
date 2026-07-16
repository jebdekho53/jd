import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { DomainEventType, OtpPurpose, Prisma, RoleName, UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { secureRandomInt } from '../../common/utils/secure-random.util';
import { getConfig } from '../../config/configuration';
import { MOBILE_OTP_DISABLED_MESSAGE } from './auth.constants';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS, REDIS_TTL } from '../../redis/redis.constants';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';
import { RiskEngineService } from '../trust-safety/risk-engine.service';
import { ReferralService } from '../wallet-loyalty/referral.service';
import { WalletService } from '../wallet-loyalty/wallet.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { OtpService } from './otp.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EmailLoginDto } from './dto/login.dto';
import { EmailSignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { StepUpDto } from './dto/step-up.dto';
import { TokenPair } from './interfaces/token-pair.interface';

export interface MeResponse {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  status: UserStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  /**
   * Derived "fully verified" status: true only when name, phone and email are
   * all present AND phone and email have each been individually verified via
   * OTP. Purely derived from already-confirmed fields — it never bypasses or
   * short-circuits the underlying phone/email OTP verification.
   */
  isVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: Date;
}

/** True only when all three identity fields exist and both are OTP-verified. */
export function isBuyerFullyVerified(input: {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
}): boolean {
  return (
    Boolean(input.name?.trim()) &&
    Boolean(input.phone?.trim()) &&
    Boolean(input.email?.trim()) &&
    input.phoneVerified &&
    input.emailVerified
  );
}

export interface RequestOtpResponse {
  message: string;
  expiresIn: number;
  /** Present when OTP was requested via email — use for verify step */
  phone?: string;
}

export interface VerifyOtpResponse extends TokenPair {
  user: MeResponse;
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly wallet: WalletService,
    private readonly referral: ReferralService,
    private readonly riskEngine: RiskEngineService,
    private readonly redis: RedisService,
    private readonly auditService: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly blocklist: VerificationBlocklistService,
    private readonly trustSafety: TrustSafetyHookService,
    private readonly emailNotifications: EmailNotificationService,
    configService: ConfigService,
  ) {
    this.cfg = getConfig(configService);
  }

  /** Public auth capabilities — derived from config (MSG91 credential presence). */
  getAuthCapabilities(): { emailEnabled: boolean; phoneOtpEnabled: boolean; whatsappEnabled: boolean } {
    return {
      emailEnabled: this.cfg.auth.emailEnabled,
      phoneOtpEnabled: this.cfg.auth.phoneOtpEnabled,
      whatsappEnabled: this.cfg.auth.whatsappEnabled,
    };
  }

  private assertEmailAuthEnabled(): void {
    if (!this.cfg.auth.emailEnabled) {
      throw new ServiceUnavailableException('Email authentication is temporarily unavailable.');
    }
  }

  private assertPhoneOtpEnabled(): void {
    if (!this.cfg.auth.phoneOtpEnabled) {
      throw new ServiceUnavailableException(MOBILE_OTP_DISABLED_MESSAGE);
    }
  }

  // ---------------------------------------------------------------------------
  // Request OTP
  // ---------------------------------------------------------------------------

  async requestOtp(
    dto: RequestOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RequestOtpResponse> {
    const viaEmail = Boolean(dto.email?.trim());

    if (!dto.phone && !dto.email?.trim()) {
      throw new BadRequestException('Phone or email is required');
    }

    if (viaEmail) {
      this.assertEmailAuthEnabled();
    } else {
      this.assertPhoneOtpEnabled();
    }

    let phone: string;
    let user = null as Awaited<ReturnType<typeof this.prisma.user.findUnique>> | null;

    if (viaEmail) {
      const email = dto.email!.trim().toLowerCase();
      await this.blocklist.assertNotBlocked({ email });
      user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new NotFoundException('No account found with this email');
      }
      phone = user.phone;
    } else {
      phone = dto.phone!;
      await this.blocklist.assertNotBlocked({ phone });
      user = await this.prisma.user.findUnique({ where: { phone } });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          status: UserStatus.PENDING_VERIFICATION,
          phoneVerified: false,
        },
      });
      this.logger.debug({ userId: user.id, phone }, 'New user created for OTP');
    }

    // Blocked accounts cannot request OTPs
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new ForbiddenException('Account is not active');
    }

    await this.blocklist.assertUserNotBlacklisted(user.id);

    const purpose =
      user.phoneVerified ? OtpPurpose.LOGIN : OtpPurpose.REGISTRATION;

    const skipSms = viaEmail || !this.cfg.auth.smsEnabled || !this.cfg.auth.phoneOtpEnabled;
    const { expiresIn, code } = await this.otpService.requestOtp(phone, purpose, user.id, {
      skipSms,
    });

    const emailRecipient = viaEmail
      ? dto.email!.trim().toLowerCase()
      : user.email?.trim().toLowerCase();
    if (emailRecipient && code) {
      void this.emailNotifications
        .sendOtpEmail(emailRecipient, code, expiresIn)
        .catch((err) => this.logger.error({ err, emailRecipient }, 'OTP email failed'));
    }

    void this.trustSafety.onOtpRequest(phone, ipAddress, dto.deviceId, userAgent).catch(() => {});

    // Domain event
    await this.domainEvents.emit(
      DomainEventType.OTP_REQUESTED,
      'user',
      user.id,
      { phone, purpose: purpose as string, viaEmail },
      { ipAddress: ipAddress ?? null },
    );

    return {
      message: viaEmail
        ? 'OTP sent to your email'
        : 'OTP sent successfully',
      expiresIn,
      phone: viaEmail ? phone : undefined,
    };
  }

  // ---------------------------------------------------------------------------
  // Verify OTP → auto-register or login
  // ---------------------------------------------------------------------------

  async verifyOtp(
    dto: VerifyOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<VerifyOtpResponse> {
    const { phone, code, deviceId, deviceName } = dto;

    // The user must exist (created during requestOtp)
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found. Please request an OTP first.');
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new ForbiddenException('Account is not active');
    }

    const purpose =
      user.phoneVerified ? OtpPurpose.LOGIN : OtpPurpose.REGISTRATION;

    // Will throw BadRequestException on invalid/expired OTP
    await this.otpService.verifyOtp(phone, code, purpose);

    const isNewUser = !user.phoneVerified;

    if (isNewUser) {
      await this.registerNewBuyer(user.id, {
        name: dto.name?.trim() || phone,
        phone,
        referralCode: dto.referralCode,
        deviceId,
      });
    } else {
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Re-fetch with updated roles
    const refreshedUser = await this.tokenService.buildUserForToken(user.id);

    const tokens = await this.tokenService.generateTokenPair(
      refreshedUser,
      deviceId,
      deviceName,
      ipAddress,
      userAgent,
      dto.rememberMe,
    );

    void this.trustSafety.onOtpVerified(user.id, {
      deviceId,
      ipAddress,
      userAgent,
      fingerprint: deviceId,
    }).catch(() => {});

    // Audit + domain events
    const eventType = isNewUser ? DomainEventType.USER_REGISTERED : DomainEventType.USER_LOGGED_IN;

    await Promise.all([
      this.auditService.log({
        actorId: user.id,
        action: isNewUser ? 'USER_REGISTERED' : 'USER_LOGGED_IN',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
        metadata: { phone, deviceId: deviceId ?? null } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        eventType,
        'user',
        user.id,
        { phone, isNewUser, deviceId: deviceId ?? null },
        { userId: user.id, ipAddress: ipAddress ?? null, userAgent: userAgent ?? null },
      ),
      this.domainEvents.emit(
        DomainEventType.OTP_VERIFIED,
        'user',
        user.id,
        { phone, purpose: purpose as string },
        { ipAddress: ipAddress ?? null },
      ),
    ]);

    const me = await this.getMe(user.id);

    if (isNewUser) {
      void this.sendWelcomeEmailIfPossible(user.id, dto.name?.trim()).catch((err) =>
        this.logger.error({ err, userId: user.id }, 'Welcome email failed'),
      );
    }

    return { ...tokens, user: me, isNewUser };
  }

  // ---------------------------------------------------------------------------
  // Email signup
  // ---------------------------------------------------------------------------

  async signup(
    dto: EmailSignupDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<VerifyOtpResponse> {
    this.assertEmailAuthEnabled();
    const email = dto.email.trim().toLowerCase();
    await this.blocklist.assertNotBlocked({ email });

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const phone = await this.generatePlaceholderPhone();
    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          status: UserStatus.PENDING_VERIFICATION,
          emailVerified: false,
          phoneVerified: false,
        },
      });

      await this.applyBuyerRegistration(
        created.id,
        {
          name: dto.name.trim(),
          phone,
          emailVerified: true,
          verifyPhone: false,
        },
        tx,
      );

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
        .sendBuyerWelcomeEmail(email, dto.name.trim(), user.id)
        .catch((err) => this.logger.error({ err, email }, 'Welcome email failed'));
      return result;
    });
  }

  // ---------------------------------------------------------------------------
  // Email + password login
  // ---------------------------------------------------------------------------

  async login(
    dto: EmailLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<VerifyOtpResponse> {
    this.assertEmailAuthEnabled();
    const email = dto.email.trim().toLowerCase();
    await this.blocklist.assertNotBlocked({ email });

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new ForbiddenException('Account is not active');
    }

    await this.blocklist.assertUserNotBlacklisted(user.id);

    const valid = await this.passwordService.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const result = await this.completeAuthentication(user.id, {
      isNewUser: false,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      ipAddress,
      userAgent,
      auditAction: 'USER_LOGGED_IN',
      metadata: { email, loginMethod: 'email' },
      rememberMe: dto.rememberMe,
    });
    void this.emailNotifications.sendLoginSecurityAlert(email, ipAddress ?? 'Unknown').catch((err) => {
      this.logger.error({ err, userId: user.id }, 'Login security email failed');
    });
    return result;
  }

  // ---------------------------------------------------------------------------
  // Forgot password
  // ---------------------------------------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; expiresIn?: number; phone?: string }> {
    if (dto.email) {
      this.assertEmailAuthEnabled();
      const email = dto.email.trim().toLowerCase();
      await this.blocklist.assertNotBlocked({ email });

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        return { message: 'If an account exists, a reset link has been sent to your email' };
      }

      if (!user.passwordHash) {
        throw new BadRequestException('This account uses mobile OTP login. Reset via mobile instead.');
      }

      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      await this.redis.set(
        REDIS_KEYS.passwordReset(tokenHash),
        user.id,
        REDIS_TTL.PASSWORD_RESET,
      );

      void this.emailNotifications
        .sendPasswordResetEmail(
          email,
          rawToken,
          Math.round(REDIS_TTL.PASSWORD_RESET / 60),
          dto.portal ?? 'buyer',
        )
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

      if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
        throw new ForbiddenException('Account is not active');
      }

      const { expiresIn } = await this.otpService.requestOtp(phone, OtpPurpose.PASSWORD_RESET, user.id);
      return { message: 'OTP sent to your mobile number', expiresIn, phone };
    }

    throw new BadRequestException('Email or phone is required');
  }

  // ---------------------------------------------------------------------------
  // Reset password
  // ---------------------------------------------------------------------------

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    let userId: string | null = null;

    if (dto.token) {
      const tokenHash = createHash('sha256').update(dto.token).digest('hex');
      userId = await this.redis.get(REDIS_KEYS.passwordReset(tokenHash));
      if (!userId) {
        throw new BadRequestException('Invalid or expired reset link. Please request a new one.');
      }
      await this.redis.del(REDIS_KEYS.passwordReset(tokenHash));
    } else if (dto.phone && dto.code) {
      this.assertPhoneOtpEnabled();
      await this.otpService.verifyOtp(dto.phone, dto.code, OtpPurpose.PASSWORD_RESET);
      const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      userId = user.id;
    } else {
      throw new BadRequestException('Provide a reset token or mobile OTP');
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.tokenService.revokeAllUserSessions(userId);

    return { message: 'Password updated successfully. Please log in with your new password.' };
  }

  // ---------------------------------------------------------------------------
  // Refresh tokens
  // ---------------------------------------------------------------------------

  async refresh(dto: RefreshTokenDto, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    return this.tokenService.rotateRefreshToken(
      dto.refreshToken,
      dto.deviceId,
      ipAddress,
      userAgent,
    );
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  async logout(
    userId: string,
    rawRefreshToken: string | undefined,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
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
      this.domainEvents.emit(
        DomainEventType.USER_LOGGED_OUT,
        'user',
        userId,
        { singleDevice: true },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);
  }

  async logoutAll(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ sessionsRevoked: number }> {
    const sessionsRevoked = await this.tokenService.revokeAllUserSessions(userId);

    await Promise.all([
      this.auditService.log({
        actorId: userId,
        action: 'USER_LOGGED_OUT_ALL',
        resourceType: 'user',
        resourceId: userId,
        ipAddress,
        userAgent,
        metadata: { sessionsRevoked } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.USER_LOGGED_OUT,
        'user',
        userId,
        { allDevices: true, sessionsRevoked },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    return { sessionsRevoked };
  }

  // ---------------------------------------------------------------------------
  // Get current user profile
  // ---------------------------------------------------------------------------

  async getMe(userId: string): Promise<MeResponse> {
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

    if (!user) throw new NotFoundException('User not found');

    const roles = user.roles.map((r) => r.role.name);
    const name = user.buyerProfile?.name ?? null;

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

  // ---------------------------------------------------------------------------
  // Private: create BuyerProfile + assign BUYER role for new users
  // ---------------------------------------------------------------------------

  private async resolveBuyerRole(client: Prisma.TransactionClient | PrismaService = this.prisma) {
    const buyerRole = await client.role.findUnique({ where: { name: RoleName.BUYER } });
    if (!buyerRole) {
      throw new ServiceUnavailableException(
        'Buyer signup is temporarily unavailable. Please contact support.',
      );
    }
    return buyerRole;
  }

  private async ensureBuyerAccess(
    userId: string,
    opts?: {
      name?: string;
      referralCode?: string;
      deviceId?: string;
      emailVerified?: boolean;
      verifyPhone?: boolean;
    },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: true,
        roles: { include: { role: true } },
      },
    });
    if (!user) return;

    const hasBuyerRole = user.roles.some((r) => r.role.name === RoleName.BUYER);
    if (hasBuyerRole && user.buyerProfile) return;

    await this.registerNewBuyer(userId, {
      name: opts?.name ?? user.buyerProfile?.name ?? user.email?.split('@')[0] ?? user.phone,
      phone: user.phone,
      referralCode: opts?.referralCode,
      deviceId: opts?.deviceId,
      emailVerified: opts?.emailVerified ?? user.emailVerified,
      verifyPhone: opts?.verifyPhone ?? user.phoneVerified,
    });
  }

  private async registerNewBuyer(
    userId: string,
    opts: {
      name: string;
      phone: string;
      referralCode?: string;
      deviceId?: string;
      emailVerified?: boolean;
      verifyPhone?: boolean;
    },
  ): Promise<void> {
    const buyerProfile = await this.prisma.$transaction(async (tx) =>
      this.applyBuyerRegistration(userId, opts, tx),
    );

    await this.finalizeBuyerRegistration(userId, buyerProfile.id, opts);
    this.logger.log({ userId, phone: opts.phone }, 'New buyer registered and activated');
  }

  private async applyBuyerRegistration(
    userId: string,
    opts: {
      name: string;
      phone: string;
      emailVerified?: boolean;
      verifyPhone?: boolean;
    },
    tx: Prisma.TransactionClient,
  ) {
    const buyerRole = await this.resolveBuyerRole(tx);

    const existing = await tx.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: true,
        roles: { include: { role: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const hasBuyerRole = existing.roles.some((r) => r.role.name === RoleName.BUYER);

    await tx.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        phoneVerified: opts.verifyPhone ?? true,
        lastLoginAt: new Date(),
        ...(opts.emailVerified !== undefined ? { emailVerified: opts.emailVerified } : {}),
      },
    });

    const profile =
      existing.buyerProfile ??
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

  private async finalizeBuyerRegistration(
    userId: string,
    buyerProfileId: string,
    opts: { referralCode?: string; deviceId?: string; phone?: string },
  ): Promise<void> {
    await this.riskEngine.getOrCreateProfile(userId);
    await this.wallet.getOrCreateWallet(buyerProfileId);

    if (opts.referralCode?.trim()) {
      try {
        await this.referral.applyReferralCode(
          buyerProfileId,
          opts.referralCode.trim(),
          opts.deviceId,
        );
      } catch (err) {
        this.logger.warn(
          { userId, referralCode: opts.referralCode, err },
          'Referral apply failed at signup',
        );
      }
    }
  }

  private async completeAuthentication(
    userId: string,
    opts: {
      isNewUser: boolean;
      deviceId?: string;
      deviceName?: string;
      ipAddress?: string;
      userAgent?: string;
      auditAction: string;
      metadata: Record<string, unknown>;
      rememberMe?: boolean;
    },
  ): Promise<VerifyOtpResponse> {
    await this.ensureBuyerAccess(userId);

    const refreshedUser = await this.tokenService.buildUserForToken(userId);

    const tokens = await this.tokenService.generateTokenPair(
      refreshedUser,
      opts.deviceId,
      opts.deviceName,
      opts.ipAddress,
      opts.userAgent,
      opts.rememberMe,
    );

    const eventType = opts.isNewUser ? DomainEventType.USER_REGISTERED : DomainEventType.USER_LOGGED_IN;

    await Promise.all([
      this.auditService.log({
        actorId: userId,
        action: opts.auditAction,
        resourceType: 'user',
        resourceId: userId,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
        metadata: opts.metadata as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        eventType,
        'user',
        userId,
        { ...opts.metadata, isNewUser: opts.isNewUser, deviceId: opts.deviceId ?? null },
        {
          userId,
          ipAddress: opts.ipAddress ?? null,
          userAgent: opts.userAgent ?? null,
        },
      ),
    ]);

    const me = await this.getMe(userId);
    return { ...tokens, user: me, isNewUser: opts.isNewUser };
  }

  async stepUp(
    userId: string,
    dto: StepUpDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.password) {
      if (!user.passwordHash) {
        throw new BadRequestException('This account does not have a password set. Please verify via OTP.');
      }
      const isValid = await this.passwordService.verify(user.passwordHash, dto.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid password');
      }
    } else if (dto.phone && dto.code) {
      if (user.phone !== dto.phone) {
        throw new BadRequestException('Phone number does not match current user');
      }
      await this.otpService.verifyOtp(dto.phone, dto.code, OtpPurpose.LOGIN);
    } else {
      throw new BadRequestException('Provide a password or phone OTP to step up');
    }

    return this.tokenService.generateStepUpToken(userId);
  }

  private async generatePlaceholderPhone(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const suffix = String(secureRandomInt(1_000_000, 9_999_999));
      const phone = `+910000${suffix}`;
      const exists = await this.prisma.user.findUnique({ where: { phone } });
      if (!exists) return phone;
    }
    throw new BadRequestException('Unable to create account. Please try again.');
  }

  private async sendWelcomeEmailIfPossible(userId: string, preferredName?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: { select: { name: true } } },
    });
    if (!user?.email) return;
    const name = preferredName || user.buyerProfile?.name || 'there';
    await this.emailNotifications.sendBuyerWelcomeEmail(user.email, name, user.id);
  }
}
