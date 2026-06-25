import { ApprovalService } from './approval.service';

describe('ApprovalService', () => {
  const mockPrisma = {
    corporateUser: { findUnique: jest.fn(), findFirst: jest.fn() },
    purchaseRequest: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  };
  const service = new ApprovalService(mockPrisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('auto-approves when amount is within workflow limit', async () => {
    mockPrisma.corporateUser.findUnique.mockResolvedValue({
      id: 'emp-1',
      account: { approvalWorkflows: [{ approvalLimit: 5000 }] },
    });
    mockPrisma.purchaseRequest.create.mockResolvedValue({ id: 'pr-1', status: 'APPROVED' });

    const result = await service.createPurchaseRequest('emp-1', 1000);
    expect(result.status).toBe('APPROVED');
  });

  it('requires approval when amount exceeds limit', async () => {
    mockPrisma.corporateUser.findUnique.mockResolvedValue({
      id: 'emp-1',
      account: { approvalWorkflows: [{ approvalLimit: 500 }] },
    });
    mockPrisma.purchaseRequest.create.mockResolvedValue({ id: 'pr-2', status: 'PENDING' });

    const result = await service.createPurchaseRequest('emp-1', 2000);
    expect(mockPrisma.purchaseRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }),
    );
    expect(result.status).toBe('PENDING');
  });

  it('needsApproval returns true above limit', () => {
    expect(service.needsApproval(1000, 500)).toBe(true);
    expect(service.needsApproval(100, 500)).toBe(false);
  });
});
