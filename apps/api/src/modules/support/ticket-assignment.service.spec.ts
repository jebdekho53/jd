import { TicketAssignmentService } from './ticket-assignment.service';
import { SupportActorType, SupportTeam } from '@prisma/client';

describe('TicketAssignmentService', () => {
  const prisma = {
    supportAgent: { findFirst: jest.fn() },
    supportAssignment: { updateMany: jest.fn(), create: jest.fn() },
    supportTicket: { update: jest.fn() },
  };
  const service = new TicketAssignmentService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('routes finance categories to FINANCE team', () => {
    expect(service.resolveTeam('REFUND_ISSUE', SupportActorType.BUYER)).toBe(SupportTeam.FINANCE);
    expect(service.resolveTeam('SETTLEMENT_ISSUE', SupportActorType.MERCHANT)).toBe(SupportTeam.FINANCE);
  });

  it('routes merchant actor to MERCHANT_OPS by default', () => {
    expect(service.resolveTeam('ACCOUNT_ISSUE', SupportActorType.MERCHANT)).toBe(SupportTeam.MERCHANT_OPS);
  });

  it('routes rider actor to RIDER_OPS by default', () => {
    expect(service.resolveTeam('APP_ISSUE', SupportActorType.RIDER)).toBe(SupportTeam.RIDER_OPS);
  });

  it('creates assignment when agent exists', async () => {
    prisma.supportAgent.findFirst.mockResolvedValue({ id: 'agent-1' });
    prisma.supportAssignment.create.mockResolvedValue({ id: 'a1' });
    const result = await service.assignTicket('t1', SupportTeam.CUSTOMER_SUPPORT);
    expect(result).toEqual({ id: 'a1' });
    expect(prisma.supportAssignment.create).toHaveBeenCalled();
  });
});
