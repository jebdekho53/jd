import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DomainEventType, OtpPurpose, Prisma, RoleName, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
    private readonly auditService: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly blocklist: VerificationBlocklistService,
    private readonly trustSafety: TrustSafetyHookService,
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

    const { expiresIn } = await this.otpService.requestOtp(phone, purpose, user.id);

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
      await this.registerNewBuyer(user.id, phone);
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

    return { ...tokens, user: me, isNewUser };
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

  private async registerNewBuyer(userId: string, phone: string): Promise<void> {
    const buyerRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: RoleName.BUYER },
    });

    await this.prisma.$transaction([
      // Activate user
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.ACTIVE,
          phoneVerified: true,
          lastLoginAt: new Date(),
        },
      }),
      // Create buyer profile
      this.prisma.buyerProfile.create({
        data: {
          userId,
          name: phone, // placeholder — buyer updates name in profile flow
        },
      }),
      // Assign BUYER role (upsert to be idempotent)
      this.prisma.userRole.upsert({
        where: {
          userId_roleId: { userId, roleId: buyerRole.id },
        },
        update: {},
        create: { userId, roleId: buyerRole.id },
      }),
    ]);

    this.logger.log({ userId, phone }, 'New buyer registered and activated');
  }
}
