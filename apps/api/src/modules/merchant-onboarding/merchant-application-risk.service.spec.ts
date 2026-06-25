import { MerchantApplicationRiskService } from './merchant-application-risk.service';

describe('MerchantApplicationRiskService', () => {
  const prisma = {
    merchantProfile: { findFirst: jest.fn().mockResolvedValue(null) },
    user: { findFirst: jest.fn().mockResolvedValue(null) },
    merchantBankAccount: { findFirst: jest.fn().mockResolvedValue(null) },
    deviceFingerprint: { count: jest.fn().mockResolvedValue(1) },
  };

  const service = new MerchantApplicationRiskService(prisma as never);

  it('returns low risk for clean application', async () => {
    const result = await service.assess({
      userId: 'u1',
      ownerPhone: '+919999999999',
      gstNumber: '09AABCU9603R1ZM',
      panNumber: 'AABCU9603R',
    });
    expect(result.riskScore).toBe(0);
    expect(result.riskFlags).toEqual([]);
  });

  it('flags duplicate GST', async () => {
    prisma.merchantProfile.findFirst.mockResolvedValueOnce({ id: 'mp1' });
    const result = await service.assess({
      userId: 'u1',
      gstNumber: '09AABCU9603R1ZM',
    });
    expect(result.riskFlags).toContain('DUPLICATE_GST');
    expect(result.riskScore).toBeGreaterThanOrEqual(40);
  });
});
