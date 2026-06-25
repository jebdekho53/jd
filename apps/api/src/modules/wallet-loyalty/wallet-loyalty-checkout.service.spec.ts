import { WalletLoyaltyCheckoutService } from './wallet-loyalty-checkout.service';
import { RewardConfigService } from './reward-config.service';
import { WalletService } from './wallet.service';
import { RewardService } from './reward.service';

describe('WalletLoyaltyCheckoutService', () => {
  const config = {
    getRules: jest.fn().mockResolvedValue({
      pointsPer100Inr: 1,
      pointValueInr: 1,
      referral: { referrerPoints: 50, referredPoints: 25, referrerWalletCredit: 50, referredWalletCredit: 100 },
      tierThresholds: { silver: 500, gold: 2000, platinum: 5000 },
      tierMultipliers: { BRONZE: 1, SILVER: 1.1, GOLD: 1.25, PLATINUM: 1.5 },
    }),
  } as unknown as RewardConfigService;

  const wallet = {
    getOrCreateWallet: jest.fn().mockResolvedValue({
      id: 'w1',
      balance: 200,
      rewardPoints: 150,
      tier: 'BRONZE',
    }),
  } as unknown as WalletService;

  const reward = {
    computePointsDiscount: jest.fn((pts: number) => pts),
    redeemPoints: jest.fn(),
  } as unknown as RewardService;

  const service = new WalletLoyaltyCheckoutService(wallet, reward, config);

  it('applies wallet and points partial payment with razorpay remainder', async () => {
    const result = await service.computeCheckoutPayment({
      buyerProfileId: 'bp1',
      grandTotal: 500,
      walletAmountToUse: 100,
      rewardPointsToRedeem: 50,
      paymentMethod: 'RAZORPAY',
    });

    expect(result.pointsDiscount).toBe(50);
    expect(result.walletAmountUsed).toBe(100);
    expect(result.razorpayAmount).toBe(350);
    expect(result.resolvedPaymentMethod).toBe('WALLET_RAZORPAY');
  });

  it('covers full order with wallet only', async () => {
    const result = await service.computeCheckoutPayment({
      buyerProfileId: 'bp1',
      grandTotal: 150,
      walletAmountToUse: 200,
      paymentMethod: 'RAZORPAY',
    });

    expect(result.walletAmountUsed).toBe(150);
    expect(result.razorpayAmount).toBe(0);
    expect(result.resolvedPaymentMethod).toBe('WALLET');
  });
});
