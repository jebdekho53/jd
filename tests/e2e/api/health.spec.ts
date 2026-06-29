import { test, expect } from '@playwright/test';
import { qaConfig } from '../test-config';
import { appendToRunState } from '../helpers/report-writer';

test.describe('API — Health & Public Endpoints', () => {
  test('GET /health returns 200 with ok status', async ({ request }) => {
    const res = await request.get(`${qaConfig.apiUrl}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
  });

  test('GET /health/uptime returns process info', async ({ request }) => {
    const res = await request.get(`${qaConfig.apiUrl}/health/uptime`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptimeSec).toBe('number');
  });

  test('GET /health/ready returns dependency check', async ({ request }) => {
    const res = await request.get(`${qaConfig.apiUrl}/health/ready`);
    expect([200, 503]).toContain(res.status());
    const text = await res.text();
    expect(text).not.toMatch(/stack trace|at \w+\./i);
  });

  test('public API does not expose stack traces on 404', async ({ request }) => {
    const res = await request.get(`${qaConfig.apiUrl}/api/v1/this-route-should-not-exist-qa`);
    expect([404, 401]).toContain(res.status());
    const text = await res.text();
    expect(text).not.toMatch(/stack trace|prisma|node_modules/i);

    if (res.status() >= 400) {
      appendToRunState({
        networkErrors: [
          {
            app: 'api',
            action: 'probe-404',
            method: 'GET',
            endpoint: `${qaConfig.apiUrl}/api/v1/this-route-should-not-exist-qa`,
            status: res.status(),
            error: text.slice(0, 200),
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }
  });
});
