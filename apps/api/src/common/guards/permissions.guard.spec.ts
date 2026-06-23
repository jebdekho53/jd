import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';

const mockReflector = { getAllAndOverride: jest.fn() };

function makeContext(permissions: string[]): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'u1', phone: '+91', email: null, roles: ['BUYER'], permissions },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PermissionsGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();
    guard = module.get(PermissionsGuard);
    jest.clearAllMocks();
  });

  it('passes when no permissions required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext([]))).toBe(true);
  });

  it('passes when user has all required permissions', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['orders:read', 'cart:write']);
    expect(guard.canActivate(makeContext(['orders:read', 'cart:write', 'profile:read']))).toBe(true);
  });

  it('throws ForbiddenException when user is missing any permission', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['orders:read', 'admin:access']);
    expect(() => guard.canActivate(makeContext(['orders:read']))).toThrow(ForbiddenException);
  });
});
