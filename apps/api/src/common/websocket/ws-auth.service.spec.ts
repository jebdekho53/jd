import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsAuthService } from './ws-auth.service';

describe('WsAuthService', () => {
  let service: WsAuthService;
  let jwtService: jest.Mocked<Pick<JwtService, 'verify'>>;

  beforeEach(async () => {
    jwtService = { verify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsAuthService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => {
              const map: Record<string, string> = {
                NODE_ENV: 'test',
                JWT_PUBLIC_KEY: 'test-public-key',
                JWT_ISSUER: 'jebdekho-api',
                JWT_AUDIENCE: 'jebdekho-clients',
              };
              return map[key] ?? fallback;
            },
          },
        },
      ],
    }).compile();

    service = module.get(WsAuthService);
  });

  it('verifyAccessToken returns user for valid payload', () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      phone: '+919999999999',
      email: 'a@b.com',
      roles: ['BUYER'],
      permissions: [],
    });

    const user = service.verifyAccessToken('token');
    expect(user).toEqual({
      id: 'user-1',
      phone: '+919999999999',
      email: 'a@b.com',
      roles: ['BUYER'],
      permissions: [],
    });
  });

  it('verifyAccessToken returns null on invalid token', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    expect(service.verifyAccessToken('bad')).toBeNull();
  });

  it('extractTokenFromSocket reads auth.token', () => {
    const token = service.extractTokenFromSocket({
      handshake: { auth: { token: 'abc' }, headers: {} },
    } as never);
    expect(token).toBe('abc');
  });

  it('extractTokenFromSocket reads Authorization header', () => {
    const token = service.extractTokenFromSocket({
      handshake: { auth: {}, headers: { authorization: 'Bearer xyz' } },
    } as never);
    expect(token).toBe('xyz');
  });

  it('hasAnyRole checks role membership', () => {
    expect(
      service.hasAnyRole(
        { id: '1', phone: '', email: null, roles: ['ADMIN'], permissions: [] },
        ['ADMIN', 'SUPER_ADMIN'],
      ),
    ).toBe(true);
    expect(
      service.hasAnyRole(
        { id: '1', phone: '', email: null, roles: ['BUYER'], permissions: [] },
        ['ADMIN'],
      ),
    ).toBe(false);
  });
});
