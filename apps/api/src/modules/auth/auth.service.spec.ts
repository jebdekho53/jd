import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';
import { RiskEngineService } from '../trust-safety/risk-engine.service';
import { ReferralService } from '../wallet-loyalty/referral.service';
import { WalletService } from '../wallet-loyalty/wallet.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { createAuthConfigMock } from '../../test/auth-config.mock';
import { MOBILE_OTP_DISABLED_MESSAGE } from './auth.constants';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: { findUniqueOrThrow: jest.fn() },
  userRole: { upsert: jest.fn() },
  buyerProfile: { create: jest.fn(), findUniqueOrThrow: jest.fn() },
  notificationPreference: { upsert: jest.fn() },
  $transaction: jest.fn(),
};

const mockEmailNotifications = {
  sendOtpEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

const mockOtpService = {
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
};

const mockTokenService = {
  generateTokenPair: jest.fn(),
  buildUserForToken: jest.fn(),
  revokeByRawToken: jest.fn(),
  revokeAllUserSessions: jest.fn(),
};

const mockPasswordService = {
  hash: jest.fn(),
  verify: jest.fn(),
};

const mockWalletService = {
  getOrCreateWallet: jest.fn(),
};

const mockReferralService = {
  applyReferralCode: jest.fn(),
};

const mockRiskEngine = {
  getOrCreateProfile: jest.fn(),
};

const mockRedisService = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

const mockAuditService = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };
const mockBlocklist = {
  assertNotBlocked: jest.fn(),
  assertUserNotBlacklisted: jest.fn(),
  assertMerchantProfileNotBlacklisted: jest.fn(),
};
const mockTrustSafety = {
  onOtpRequest: jest.fn().mockResolvedValue(undefined),
  onOtpVerified: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  async function createService(configOverrides: Record<string, string> = {}) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: ReferralService, useValue: mockReferralService },
        { provide: RiskEngineService, useValue: mockRiskEngine },
        { provide: RedisService, useValue: mockRedisService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: DomainEventsService, useValue: mockDomainEvents },
        { provide: VerificationBlocklistService, useValue: mockBlocklist },
        { provide: TrustSafetyHookService, useValue: mockTrustSafety },
        { provide: EmailNotificationService, useValue: mockEmailNotifications },
        { provide: ConfigService, useValue: createAuthConfigMock(configOverrides) },
      ],
    }).compile();

    return module.get<AuthService>(AuthService);
  }

  beforeEach(async () => {
    service = await createService();
    jest.clearAllMocks();
    mockBlocklist.assertNotBlocked.mockResolvedValue(undefined);
    mockBlocklist.assertUserNotBlacklisted.mockResolvedValue(undefined);
    mockRiskEngine.getOrCreateProfile.mockResolvedValue({});
    mockWalletService.getOrCreateWallet.mockResolvedValue({ id: 'wallet-1' });
    mockReferralService.applyReferralCode.mockResolvedValue({});
    mockPasswordService.hash.mockResolvedValue('hashed-password');
    mockPasswordService.verify.mockResolvedValue(true);
  });

  describe('requestOtp', () => {
    it('rejects phone OTP when AUTH_PHONE_OTP_ENABLED=false', async () => {
      service = await createService({ AUTH_PHONE_OTP_ENABLED: 'false' });

      await expect(service.requestOtp({ phone: '+919876543210' }, '127.0.0.1')).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(service.requestOtp({ phone: '+919876543210' }, '127.0.0.1')).rejects.toThrow(
        MOBILE_OTP_DISABLED_MESSAGE,
      );
      expect(mockOtpService.requestOtp).not.toHaveBeenCalled();
    });

    it('creates a new user when phone does not exist', async () => {
      mockBlocklist.assertUserNotBlacklisted.mockResolvedValue(undefined);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        phone: '+919876543210',
        status: UserStatus.PENDING_VERIFICATION,
        phoneVerified: false,
      });
      mockOtpService.requestOtp.mockResolvedValue({ expiresIn: 300, code: '123456' });
      mockDomainEvents.emit.mockResolvedValue('event-1');

      const result = await service.requestOtp({ phone: '+919876543210' }, '127.0.0.1');

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ phone: '+919876543210' }) }),
      );
      expect(result.expiresIn).toBe(300);
    });

    it('throws ForbiddenException for suspended accounts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone: '+919876543210',
        status: UserStatus.SUSPENDED,
        phoneVerified: true,
      });

      await expect(service.requestOtp({ phone: '+919876543210' }, '127.0.0.1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('issues tokens for existing active user', async () => {
      const mockUser = {
        id: 'user-1',
        phone: '+919876543210',
        email: null,
        status: UserStatus.ACTIVE,
        phoneVerified: true,
        roles: [{ role: { name: 'BUYER' } }],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue('otp-1');
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser });
      mockTokenService.buildUserForToken.mockResolvedValue({
        ...mockUser,
        permissions: ['cart:read'],
      });
      mockTokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access.token.here',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      });
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          roles: mockUser.roles.map((r) => ({
            ...r,
            role: { ...r.role, permissions: [] },
          })),
        });
      mockAuditService.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('event-1');

      const result = await service.verifyOtp({
        phone: '+919876543210',
        code: '123456',
      });

      expect(result.accessToken).toBe('access.token.here');
      expect(result.isNewUser).toBe(false);
    });
  });

  describe('signup', () => {
    it('rejects signup when AUTH_EMAIL_ENABLED=false', async () => {
      service = await createService({ AUTH_EMAIL_ENABLED: 'false' });

      await expect(
        service.signup({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('rejects duplicate email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.signup({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('rejects login when AUTH_EMAIL_ENABLED=false', async () => {
      service = await createService({ AUTH_EMAIL_ENABLED: 'false' });

      await expect(
        service.login({ email: 'test@example.com', password: 'secret' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('rejects invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        status: UserStatus.ACTIVE,
      });
      mockPasswordService.verify.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('rejects mobile reset when phone OTP is disabled', async () => {
      service = await createService({ AUTH_PHONE_OTP_ENABLED: 'false' });

      await expect(service.forgotPassword({ phone: '+919876543210' })).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(mockOtpService.requestOtp).not.toHaveBeenCalled();
    });

    it('requires email or phone', async () => {
      await expect(service.forgotPassword({})).rejects.toThrow(BadRequestException);
    });
  });

  describe('logoutAll', () => {
    it('revokes all sessions and emits events', async () => {
      mockTokenService.revokeAllUserSessions.mockResolvedValue(3);
      mockAuditService.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue('event-1');

      const result = await service.logoutAll('user-1', '127.0.0.1');

      expect(result.sessionsRevoked).toBe(3);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_LOGGED_OUT_ALL' }),
      );
    });
  });
});
