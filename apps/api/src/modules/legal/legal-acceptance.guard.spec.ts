import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LegalDocumentCode } from '@prisma/client';
import { LegalAcceptanceGuard } from './legal-acceptance.guard';
import { LegalService } from './legal.service';

function contextWith(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeGuard(metaCode: LegalDocumentCode | undefined, hasAccepted: boolean) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(metaCode),
  } as unknown as Reflector;
  const legal = {
    hasAccepted: jest.fn().mockResolvedValue(hasAccepted),
  } as unknown as LegalService;
  return { guard: new LegalAcceptanceGuard(reflector, legal), legal };
}

describe('LegalAcceptanceGuard', () => {
  it('is a no-op on routes without @RequireLegalAcceptance', async () => {
    const { guard, legal } = makeGuard(undefined, false);
    await expect(guard.canActivate(contextWith({ id: 'u1' }))).resolves.toBe(true);
    expect(legal.hasAccepted).not.toHaveBeenCalled();
  });

  it('passes when the current version is accepted', async () => {
    const { guard, legal } = makeGuard(LegalDocumentCode.BUYER_TERMS, true);
    await expect(guard.canActivate(contextWith({ id: 'u1' }))).resolves.toBe(true);
    expect(legal.hasAccepted).toHaveBeenCalledWith('u1', LegalDocumentCode.BUYER_TERMS);
  });

  it('rejects with a machine-readable 403 when not accepted (or only an older version)', async () => {
    // The guard sees a single boolean from LegalService.hasAccepted, which is
    // version-aware: "never accepted" and "accepted only v0 after a v1 bump"
    // both arrive here as `false` and must be rejected identically.
    const { guard } = makeGuard(LegalDocumentCode.MERCHANT_AGREEMENT, false);
    expect.assertions(3);
    try {
      await guard.canActivate(contextWith({ id: 'u1' }));
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const body = (err as ForbiddenException).getResponse() as Record<string, unknown>;
      expect(body.error).toBe('LEGAL_ACCEPTANCE_REQUIRED');
      expect(body.code).toBe(LegalDocumentCode.MERCHANT_AGREEMENT);
    }
  });

  it('never fails open: rejects when there is no authenticated user', async () => {
    const { guard, legal } = makeGuard(LegalDocumentCode.BUYER_TERMS, true);
    await expect(guard.canActivate(contextWith(undefined))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(legal.hasAccepted).not.toHaveBeenCalled();
  });
});
