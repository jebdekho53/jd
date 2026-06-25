import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: { findUniqueOrThrow: jest.fn() },
  userRole: { upsert: jest.fn() },
  buyerProfile: { create: jest.fn() },
  $transaction: jest.fn(),
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

const mockAuditService = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };
const mockBlocklist = {
  assertNotBlocked: jest.fn(),
  assertUserNotBlacklisted: jest.fn(),
  assertMerchantProfileNotBlacklisted: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: DomainEventsService, useValue: mockDomainEvents },
        { provide: VerificationBlocklistService, useValue: mockBlocklist },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── requestOtp ────────────────────────────────────────────────────────────

  describe('requestOtp', () => {
    it('creates a new user when phone does not exist', async () => {
      mockBlocklist.assertNotBlocked.mockResolvedValue(undefined);
      mockBlocklist.assertUserNotBlacklisted.mockResolvedValue(undefined);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        phone: '+919876543210',
        status: UserStatus.PENDING_VERIFICATION,
        phoneVerified: false,
      });
      mockOtpService.requestOtp.mockResolvedValue({ expiresIn: 300 });
      mockDomainEvents.emit.mockResolvedValue('event-1');

      const result = await service.requestOtp(
        { phone: '+919876543210' },
        '127.0.0.1',
      );

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

      await expect(
        service.requestOtp({ phone: '+919876543210' }, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── verifyOtp ────────────────────────────────────────────────────────────

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
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, roles: mockUser.roles.map(r => ({ ...r, role: { ...r.role, permissions: [] } })) });
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

  // ── logoutAll ─────────────────────────────────────────────────────────────

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
