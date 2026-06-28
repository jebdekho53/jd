import { createHmac } from 'crypto';
import { ShadowfaxWebhookService } from './shadowfax-webhook.service';

describe('ShadowfaxWebhookService signature', () => {
  const secret = 'test-webhook-secret';

  function buildService() {
    const prisma = {
      deliveryProvider: { upsert: jest.fn() },
      providerWebhook: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      providerShipment: { findFirst: jest.fn(), update: jest.fn() },
    };
    const orchestrator = { applyStatusUpdate: jest.fn() };
    const events = { emit: jest.fn() };
    const config = { get: (key: string) => (key === 'SHADOWFAX_WEBHOOK_SECRET' ? secret : '') };
    return new ShadowfaxWebhookService(prisma as any, orchestrator as any, events as any, config as any);
  }

  it('accepts valid HMAC signature', () => {
    const svc = buildService();
    const body = Buffer.from('{"event_id":"e1"}');
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(() => svc.verifySignature(body, sig)).not.toThrow();
  });

  it('rejects invalid signature', () => {
    const svc = buildService();
    const body = Buffer.from('{"event_id":"e1"}');
    expect(() => svc.verifySignature(body, 'bad-signature')).toThrow();
  });

  it('accepts Authorization Token header matching webhook secret', () => {
    const svc = buildService();
    expect(svc.matchesAuthorizationToken(`Token ${secret}`)).toBe(true);
    expect(svc.matchesAuthorizationToken(`Bearer ${secret}`)).toBe(true);
  });

  it('verifyWebhookAuth accepts token when signature is absent', () => {
    const svc = buildService();
    const body = Buffer.from('{"event_id":"e1"}');
    expect(() => svc.verifyWebhookAuth(body, undefined, `Token ${secret}`)).not.toThrow();
  });
});
