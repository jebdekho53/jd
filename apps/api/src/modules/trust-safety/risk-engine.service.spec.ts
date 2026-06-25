import { RiskEngineService } from './risk-engine.service';

describe('RiskEngineService', () => {
  const prisma = {
    riskEvent: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    accountRestriction: { count: jest.fn() },
    fraudCase: { count: jest.fn() },
    riskProfile: { upsert: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    buyerProfile: { findUnique: jest.fn(), updateMany: jest.fn() },
  };

  const engine = new RiskEngineService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('records events idempotently', async () => {
    prisma.riskEvent.findUnique.mockResolvedValue({ id: 'e1' });
    const result = await engine.recordEvent({
      userId: 'u1',
      eventType: 'TEST',
      severity: 'LOW',
      idempotencyKey: 'key-1',
    });
    expect(result.id).toBe('e1');
    expect(prisma.riskEvent.create).not.toHaveBeenCalled();
  });

  it('recalculates scores from events', async () => {
    prisma.riskEvent.findMany.mockResolvedValue([
      { severity: 'HIGH' },
      { severity: 'MEDIUM' },
    ]);
    prisma.accountRestriction.count.mockResolvedValue(0);
    prisma.fraudCase.count.mockResolvedValue(1);
    prisma.riskProfile.upsert.mockResolvedValue({});

    const scores = await engine.recalculate('u1');
    expect(scores.riskScore).toBeGreaterThan(0);
    expect(scores.trustScore).toBeLessThan(100);
    expect(prisma.riskProfile.upsert).toHaveBeenCalled();
  });
});
