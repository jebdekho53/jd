import { SessionError } from '@/services/auth/auth-api';
import { isAuthExpiredError, isOfflineSessionError } from './offline-session';

describe('offline-session', () => {
  it('detects offline fetch failures', () => {
    expect(isOfflineSessionError(new SessionError('offline', 0, 'OFFLINE'))).toBe(true);
    expect(isOfflineSessionError(new SessionError('bad', 401))).toBe(false);
  });

  it('detects auth expiry separately from offline', () => {
    expect(isAuthExpiredError(new SessionError('expired', 401))).toBe(true);
    expect(isAuthExpiredError(new SessionError('offline', 0))).toBe(false);
  });
});
