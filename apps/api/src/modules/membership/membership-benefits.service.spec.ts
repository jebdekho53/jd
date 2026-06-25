import { MembershipBenefitService, PLUS_REWARD_MULTIPLIER } from './membership-benefit.service';
import { MembershipBenefitType } from '@prisma/client';

describe('MembershipBenefitService', () => {
  const mockPrisma = {
    membershipSubscription: { findFirst: jest.fn() },
    membershipUsage: { create: jest.fn() },
  };
  const service = new MembershipBenefitService(mockPrisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('applies free delivery benefit when subscribed', async () => {
    mockPrisma.membershipSubscription.findFirst.mockResolvedValue({
      plan: { benefits: [{ type: MembershipBenefitType.FREE_DELIVERY }] },
    });
    expect(await service.hasFreeDelivery('user-1')).toBe(true);
  });

  it('applies reward multiplier for EXTRA_REWARDS', () => {
    const mult = service.getRewardMultiplier([MembershipBenefitType.EXTRA_REWARDS]);
    expect(mult).toBe(PLUS_REWARD_MULTIPLIER);
  });

  it('returns 1x multiplier without EXTRA_REWARDS', () => {
    expect(service.getRewardMultiplier([MembershipBenefitType.FREE_DELIVERY])).toBe(1);
  });
});
