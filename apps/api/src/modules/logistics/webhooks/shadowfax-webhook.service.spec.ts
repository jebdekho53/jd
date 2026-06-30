import { createHmac } from 'crypto';
import { ShadowfaxWebhookService } from './shadowfax-webhook.service';

describe('ShadowfaxWebhookService signature', () => {
  const secret = 'test-webhook-secret';

  function buildService() {
    const prisma = {
      deliveryProvider: { upsert: jest.fn().mockResolvedValue({ id: 'dp1' }) },
      providerWebhook: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'wh1' }),
        update: jest.fn(),
      },
      providerShipment: { findFirst: jest.fn(), update: jest.fn() },
    };
    const orchestrator = { applyStatusUpdate: jest.fn() };
    const events = { emit: jest.fn() };
    const config = { get: (key: string) => (key === 'SHADOWFAX_WEBHOOK_SECRET' ? secret : '') };
    return {
      prisma,
      orchestrator,
      service: new ShadowfaxWebhookService(prisma as any, orchestrator as any, events as any, config as any),
    };
  }

  it('accepts valid HMAC signature', () => {
    const { service: svc } = buildService();
    const body = Buffer.from('{"event_id":"e1"}');
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(() => svc.verifySignature(body, sig)).not.toThrow();
  });

  it('rejects invalid signature', () => {
    const { service: svc } = buildService();
    const body = Buffer.from('{"event_id":"e1"}');
    expect(() => svc.verifySignature(body, 'bad-signature')).toThrow();
  });

  it('accepts Authorization Token header matching webhook secret', () => {
    const { service: svc } = buildService();
    expect(svc.matchesAuthorizationToken(`Token ${secret}`)).toBe(true);
    expect(svc.matchesAuthorizationToken(`Bearer ${secret}`)).toBe(true);
  });

  it('verifyWebhookAuth accepts token when signature is absent', () => {
    const { service: svc } = buildService();
    const body = Buffer.from('{"event_id":"e1"}');
    expect(() => svc.verifyWebhookAuth(body, undefined, `Token ${secret}`)).not.toThrow();
  });

  it('ignores duplicate event ids without applying a status update', async () => {
    const { service, prisma, orchestrator } = buildService();
    prisma.providerWebhook.findUnique.mockResolvedValue({ id: 'existing-webhook' });

    await service.handlePayload(
      Buffer.from(JSON.stringify({ event_id: 'dup-1', data: { shipment_id: 'sfx-1', status: 'picked_up' } })),
      undefined,
      `Token ${secret}`,
    );

    expect(prisma.providerWebhook.create).not.toHaveBeenCalled();
    expect(orchestrator.applyStatusUpdate).not.toHaveBeenCalled();
  });
});
