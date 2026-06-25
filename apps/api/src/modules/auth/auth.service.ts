import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DomainEventType, OtpPurpose, Prisma, RoleName, UserStatus } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
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
import { TokenPair } from './interfaces/token-pair.interface';

export interface MeResponse {
  id: string;
  phone: string;
  email: string | null;
  status: UserStatus;
  phoneVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: Date;
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
  ) {}

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

    const { expiresIn, code } = await this.otpService.requestOtp(phone, purpose, user.id);

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
        ? 'OTP sent to your registered mobile number'
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
    const email = dto.email.trim().toLowerCase();
    await this.blocklist.assertNotBlocked({ email });

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const phone = await this.generatePlaceholderPhone();
    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerified: false,
        phoneVerified: false,
      },
    });

    await this.registerNewBuyer(user.id, {
      name: dto.name.trim(),
      phone,
      referralCode: dto.referralCode,
      deviceId: dto.deviceId,
      emailVerified: true,
      verifyPhone: false,
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

  // ---------------------------------------------------------------------------
  // Email + password login
  // ---------------------------------------------------------------------------

  async login(
    dto: EmailLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<VerifyOtpResponse> {
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

  // ---------------------------------------------------------------------------
  // Forgot password
  // ---------------------------------------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; expiresIn?: number; phone?: string }> {
    if (dto.email) {
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
        )
        .catch((err) => this.logger.error({ err, email }, 'Password reset email failed'));

      return { message: 'If an account exists, a reset link has been sent to your email' };
    }

    if (dto.phone) {
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
      await this.tokenService.revokeByRawToken(rawRefreshToken);
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
    };
  }

  // ---------------------------------------------------------------------------
  // Private: create BuyerProfile + assign BUYER role for new users
  // ---------------------------------------------------------------------------

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
    const buyerRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: RoleName.BUYER },
    });

    const buyerProfile = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.ACTIVE,
          phoneVerified: opts.verifyPhone ?? true,
          lastLoginAt: new Date(),
          ...(opts.emailVerified !== undefined ? { emailVerified: opts.emailVerified } : {}),
        },
      });

      const profile = await tx.buyerProfile.create({
        data: {
          userId,
          name: opts.name,
        },
      });

      await tx.userRole.upsert({
        where: {
          userId_roleId: { userId, roleId: buyerRole.id },
        },
        update: {},
        create: { userId, roleId: buyerRole.id },
      });

      await tx.notificationPreference.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      return profile;
    });

    await this.riskEngine.getOrCreateProfile(userId);
    await this.wallet.getOrCreateWallet(buyerProfile.id);

    if (opts.referralCode?.trim()) {
      try {
        await this.referral.applyReferralCode(
          buyerProfile.id,
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

    this.logger.log({ userId, phone: opts.phone }, 'New buyer registered and activated');
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
    },
  ): Promise<VerifyOtpResponse> {
    const refreshedUser = await this.tokenService.buildUserForToken(userId);

    const tokens = await this.tokenService.generateTokenPair(
      refreshedUser,
      opts.deviceId,
      opts.deviceName,
      opts.ipAddress,
      opts.userAgent,
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

  private async generatePlaceholderPhone(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const suffix = String(Math.floor(1_000_000 + Math.random() * 9_000_000));
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
    await this.emailNotifications.sendWelcomeEmail(user.email, name);
  }
}
