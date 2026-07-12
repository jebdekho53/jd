import { classifySendError } from './whatsapp-error-codes';

describe('classifySendError', () => {
  it('retries throttling and transient Meta errors', () => {
    expect(classifySendError(80007)).toBe('retry');
    expect(classifySendError(130429)).toBe('retry');
    expect(classifySendError(131056)).toBe('retry');
    expect(classifySendError(undefined, 429)).toBe('retry');
    expect(classifySendError(undefined, 503)).toBe('retry');
    // A timeout gives us neither a Meta code nor an HTTP status.
    expect(classifySendError(undefined, undefined)).toBe('retry');
  });

  it('aborts the whole batch on credential and account failures', () => {
    expect(classifySendError(190)).toBe('abort'); // expired token
    expect(classifySendError(131031)).toBe('abort'); // account restricted
    expect(classifySendError(undefined, 401)).toBe('abort');
  });

  it('fails only the current recipient for per-message problems', () => {
    expect(classifySendError(131026)).toBe('fail'); // undeliverable number
    expect(classifySendError(131047)).toBe('fail'); // outside the 24h window
    expect(classifySendError(132001)).toBe('fail'); // template does not exist
    expect(classifySendError(undefined, 400)).toBe('fail');
  });
});
