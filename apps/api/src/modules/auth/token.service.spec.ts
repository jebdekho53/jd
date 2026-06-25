import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { createHash } from 'crypto';

const mockPrisma = {
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
  userRole: { findMany: jest.fn() },
  user: { findUniqueOrThrow: jest.fn() },
};

const mockRedis = { set: jest.fn(), get: jest.fn(), del: jest.fn() };
const mockJwt = { sign: jest.fn(() => 'mocked.jwt.token') };
const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string | number> = {
      JWT_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
      JWT_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
      JWT_KEY_ID: 'current',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '30d',
      JWT_ISSUER: 'jebdekho-api',
      CORS_ORIGINS: 'https://jebdekho.com',
    };
    return map[key];
  }),
};

describe('TokenService', () => {
  let service: TokenService;

  const mockUser = {
    id: 'user-1',
    phone: '+919876543210',
    email: null,
    roles: [{ role: { name: 'BUYER' } }],
    permissions: ['cart:read'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jest.clearAllMocks();
  });

  describe('generateTokenPair', () => {
    it('creates refresh token in database and returns token pair', async () => {
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.generateTokenPair(mockUser);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', phone: '+919876543210' }),
      );
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(1);
      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(900); // 15m
    });
  });

  describe('rotateRefreshToken', () => {
    it('throws UnauthorizedException for unknown tokens', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.rotateRefreshToken('unknown-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('revokes all sessions on reuse detection (revoked token presented)', async () => {
      const rawToken = 'valid-raw-token';
      const hash = createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: hash,
        revokedAt: new Date(), // already revoked!
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        deviceId: 'device-1',
        deviceName: 'Test Device',
        user: { id: 'user-1', phone: '+91', email: null, roles: [] },
      });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await expect(service.rotateRefreshToken(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', revokedAt: null } }),
      );
    });
  });
});
