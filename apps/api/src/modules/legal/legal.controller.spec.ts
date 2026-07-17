import { LegalController } from './legal.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../common/constants';

/**
 * Guards are applied per-handler in this codebase — only ThrottlerGuard is
 * global — so a handler that reads `user.id` without JwtAuthGuard is not merely
 * unprotected, it crashes on `undefined`. That is exactly what shipped here
 * once, so these tests assert the wiring, which the service-level tests (mocked
 * user) can't see.
 */
describe('LegalController wiring', () => {
  const guardsOn = (handler: keyof LegalController): unknown[] =>
    Reflect.getMetadata('__guards__', LegalController.prototype[handler] as object) ?? [];

  const isPublic = (handler: keyof LegalController): boolean =>
    Reflect.getMetadata(IS_PUBLIC_KEY, LegalController.prototype[handler] as object) === true;

  it.each<keyof LegalController>(['accept', 'pending', 'history'])(
    'guards %s with JwtAuthGuard — it reads the signed-in user',
    (handler) => {
      expect(guardsOn(handler)).toContain(JwtAuthGuard);
    },
  );

  it.each<keyof LegalController>(['accept', 'pending', 'history'])(
    'does not mark %s public',
    (handler) => {
      expect(isPublic(handler)).toBe(false);
    },
  );

  it('leaves the document endpoint public — it must be readable before signing up', () => {
    expect(isPublic('getDocument')).toBe(true);
  });
});
