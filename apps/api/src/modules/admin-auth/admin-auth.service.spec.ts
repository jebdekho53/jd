import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminPasswordService } from './admin-password.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TokenService } from '../auth/token.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { EmailNotificationService } from '../email/email-notification.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrisma: any = {
    adminProfile: { count: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    adminSettings: { findUnique: jest.fn() },
    adminLoginAudit: { create: jest.fn(), findFirst: jest.fn() },
    adminSession: { create: jest.fn(), updateMany: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    userRole: { create: jest.fn() },
    role: { findUnique: jest.fn() },
    refreshToken: { findUnique: jest.fn() },
    store: { count: jest.fn() },
    order: { count: jest.fn() },
    riderProfile: { count: jest.fn() },
    merchantProfile: { count: jest.fn() },
    $transaction: jest.fn((fn: unknown) =>
      typeof fn === 'function' ? (fn as (tx: typeof mockPrisma) => unknown)(mockPrisma) : Promise.all(fn as Promise<unknown>[]),
    ),
  };

  const mockRedis = {
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockTokenService = {
    buildUserForToken: jest.fn(),
    generateTokenPair: jest.fn(),
    revokeAllUserSessions: jest.fn(),
    revokeByRawToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        AdminPasswordService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: TokenService, useValue: mockTokenService },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: DomainEventsService, useValue: { emit: jest.fn() } },
        { provide: EmailNotificationService, useValue: {
          sendAdminWelcomeEmail: jest.fn(),
          sendAdminPasswordResetEmail: jest.fn(),
          sendAdminSecurityAlert: jest.fn(),
          sendAdminNewDeviceLogin: jest.fn(),
        } },
        { provide: ConfigService, useValue: {
          get: (key: string, def?: unknown) => {
            const map: Record<string, unknown> = {
              JWT_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nMOCK\n-----END RSA PRIVATE KEY-----',
              JWT_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----',
            };
            return map[key] ?? def;
          },
        } },
      ],
    }).compile();

    service = module.get(AdminAuthService);
    jest.clearAllMocks();

    mockPrisma.adminSettings.findUnique.mockResolvedValue({ maxFailedAttempts: 10, lockoutMinutes: 30 });
    mockPrisma.adminProfile.count.mockResolvedValue(1);
    mockPrisma.adminLoginAudit.create.mockResolvedValue({});
    mockPrisma.adminLoginAudit.findFirst.mockResolvedValue({ id: 'prev' });
  });

  it('rejects invalid credentials for unknown email', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@test.com', password: 'wrongpass1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns login stats', async () => {
    mockPrisma.store.count.mockResolvedValue(5);
    mockPrisma.order.count.mockResolvedValue(100);
    mockPrisma.riderProfile.count.mockResolvedValue(12);
    mockPrisma.merchantProfile.count.mockResolvedValue(8);
    const stats = await service.getLoginStats();
    expect(stats).toEqual({
      activeStores: 5,
      totalOrders: 100,
      activeRiders: 12,
      merchants: 8,
    });
  });
});
