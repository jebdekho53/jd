import { SupportSlaService } from './support-sla.service';
import { SupportPriority } from '@prisma/client';

describe('SupportSlaService', () => {
  const prisma = {
    supportSla: { findUnique: jest.fn() },
  };
  const service = new SupportSlaService(prisma as never);

  it('computes deadlines from SLA config', async () => {
    prisma.supportSla.findUnique.mockResolvedValue({
      responseMinutes: 60,
      resolutionMinutes: 480,
    });
    const from = new Date('2026-01-01T00:00:00Z');
    const deadlines = await service.computeDeadlines(SupportPriority.HIGH, from);
    expect(deadlines.slaResponseDue.getTime()).toBe(from.getTime() + 60 * 60 * 1000);
    expect(deadlines.slaResolutionDue.getTime()).toBe(from.getTime() + 480 * 60 * 1000);
  });

  it('detects resolution overdue', () => {
    const overdue = service.isResolutionOverdue({
      resolvedAt: null,
      slaResolutionDue: new Date(Date.now() - 1000),
      status: 'OPEN',
    });
    expect(overdue).toBe(true);
  });

  it('ignores resolved tickets', () => {
    const overdue = service.isResolutionOverdue({
      resolvedAt: new Date(),
      slaResolutionDue: new Date(Date.now() - 1000),
      status: 'RESOLVED',
    });
    expect(overdue).toBe(false);
  });
});
