import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';

const mockReflector = { getAllAndOverride: jest.fn() };

function makeContext(userRoles: string[]): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'u1', phone: '+91', email: null, roles: userRoles, permissions: [] },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();
    guard = module.get(RolesGuard);
    jest.clearAllMocks();
  });

  it('passes when no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext([]))).toBe(true);
  });

  it('passes when user has required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(guard.canActivate(makeContext(['ADMIN', 'BUYER']))).toBe(true);
  });

  it('throws ForbiddenException when user lacks required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(makeContext(['BUYER']))).toThrow(ForbiddenException);
  });
});
