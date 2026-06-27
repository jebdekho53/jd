describe('resolveWsCorsOrigins', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('never returns wildcard', async () => {
    process.env.CORS_ORIGINS = 'https://jebdekho.com,https://admin.jebdekho.com';
    const { resolveWsCorsOrigins } = await import('./ws-cors.util');
    const origins = resolveWsCorsOrigins();
    expect(origins).not.toContain('*');
    expect(origins).toEqual(['https://jebdekho.com', 'https://admin.jebdekho.com']);
  });

  it('uses localhost defaults in development when unset', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGINS;
    const { resolveWsCorsOrigins } = await import('./ws-cors.util');
    const origins = resolveWsCorsOrigins();
    expect(origins.some((o) => o.includes('localhost:3000'))).toBe(true);
  });
});
