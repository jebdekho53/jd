import { createBffTokenProvider, RealtimeUnauthorizedError } from './token-provider';

/** Builds an unsigned JWT whose `exp` sits `secondsFromNow` in the future. */
function jwt(secondsFromNow: number): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + secondsFromNow };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `header.${b64}.signature`;
}

function mockFetch(impl: () => Partial<Response>) {
  global.fetch = jest.fn(() => Promise.resolve(impl() as Response)) as never;
  return global.fetch as jest.Mock;
}

function okToken(token: string): Partial<Response> {
  return { ok: true, status: 200, json: () => Promise.resolve({ data: { token } }) };
}

describe('createBffTokenProvider', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('fetches a token from the BFF route', async () => {
    const token = jwt(600);
    const fetchMock = mockFetch(() => okToken(token));

    const provider = createBffTokenProvider();
    await expect(provider()).resolves.toBe(token);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/ws-token', {
      credentials: 'include',
      cache: 'no-store',
    });
  });

  it('reuses a token that is still well within its lifetime', async () => {
    const fetchMock = mockFetch(() => okToken(jwt(600)));
    const provider = createBffTokenProvider();

    await provider();
    await provider();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // The whole point of the provider: a socket reconnecting near expiry must not
  // replay the dying token, or the gateway rejects it forever.
  it('refetches once the cached token is inside the expiry skew', async () => {
    const fetchMock = mockFetch(() => okToken(jwt(10)));
    const provider = createBffTokenProvider();

    await provider();
    await provider();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refetches when the token carries no readable expiry', async () => {
    const fetchMock = mockFetch(() => okToken('opaque-token'));
    const provider = createBffTokenProvider();

    await provider();
    await provider();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('collapses concurrent callers into a single request', async () => {
    const fetchMock = mockFetch(() => okToken(jwt(600)));
    const provider = createBffTokenProvider();

    const [a, b, c] = await Promise.all([provider(), provider(), provider()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it.each([401, 403])('raises RealtimeUnauthorizedError on %s', async (status) => {
    mockFetch(() => ({ ok: false, status }));
    const provider = createBffTokenProvider();

    await expect(provider()).rejects.toBeInstanceOf(RealtimeUnauthorizedError);
  });

  it('raises RealtimeUnauthorizedError when the body carries no token', async () => {
    mockFetch(() => ({ ok: true, status: 200, json: () => Promise.resolve({ data: {} }) }));
    const provider = createBffTokenProvider();

    await expect(provider()).rejects.toBeInstanceOf(RealtimeUnauthorizedError);
  });

  it('surfaces a transient server error as a retryable failure, not unauthorized', async () => {
    mockFetch(() => ({ ok: false, status: 500 }));
    const provider = createBffTokenProvider();

    await expect(provider()).rejects.not.toBeInstanceOf(RealtimeUnauthorizedError);
  });

  it('recovers after a failure rather than caching the error', async () => {
    let attempt = 0;
    const token = jwt(600);
    global.fetch = jest.fn(() => {
      attempt += 1;
      if (attempt === 1) return Promise.resolve({ ok: false, status: 500 } as Response);
      return Promise.resolve(okToken(token) as Response);
    }) as never;

    const provider = createBffTokenProvider();
    await expect(provider()).rejects.toBeTruthy();
    await expect(provider()).resolves.toBe(token);
  });
});
