import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { RewardConfigService } from './reward-config.service';
import { RewardService } from './reward.service';
import { WalletService } from './wallet.service';

export interface CheckoutWalletInput {
  buyerProfileId: string;
  grandTotal: number;
  walletAmountToUse?: number;
  rewardPointsToRedeem?: number;
  paymentMethod: 'COD' | 'RAZORPAY';
}

export interface CheckoutWalletResult {
  walletAmountUsed: number;
  rewardPointsUsed: number;
  pointsDiscount: number;
  amountDue: number;
  razorpayAmount: number;
  resolvedPaymentMethod: PaymentMethod;
  initialOrderStatus: OrderStatus;
  initialPaymentStatus: PaymentStatus;
}

type TxClient = Prisma.TransactionClient;

@Injectable()
export class WalletLoyaltyCheckoutService {
  constructor(
    private readonly wallet: WalletService,
    private readonly reward: RewardService,
    private readonly config: RewardConfigService,
  ) {}

  async computeCheckoutPayment(input: CheckoutWalletInput): Promise<CheckoutWalletResult> {
    const rules = await this.config.getRules();
    const buyerWallet = await this.wallet.getOrCreateWallet(input.buyerProfileId);

    const pointsToRedeem = Math.max(0, input.rewardPointsToRedeem ?? 0);
    if (pointsToRedeem > buyerWallet.rewardPoints) {
      throw new BadRequestException('Insufficient reward points');
    }

    const pointsDiscount = this.reward.computePointsDiscount(pointsToRedeem, rules);
    let amountDue = Math.max(0, round(input.grandTotal - pointsDiscount));

    const requestedWallet = Math.max(0, input.walletAmountToUse ?? 0);
    const walletBalance = Number(buyerWallet.balance);
    const walletAmountUsed = Math.min(requestedWallet, walletBalance, amountDue);
    amountDue = round(amountDue - walletAmountUsed);

    const razorpayAmount = amountDue;
    let resolvedPaymentMethod: PaymentMethod;
    let initialOrderStatus: OrderStatus;
    let initialPaymentStatus: PaymentStatus;

    if (amountDue <= 0 && walletAmountUsed > 0) {
      resolvedPaymentMethod = PaymentMethod.WALLET;
      initialOrderStatus = OrderStatus.MERCHANT_ACCEPTED;
      initialPaymentStatus = PaymentStatus.PAID;
    } else if (walletAmountUsed > 0 && input.paymentMethod === 'RAZORPAY') {
      resolvedPaymentMethod = PaymentMethod.WALLET_RAZORPAY;
      initialOrderStatus = OrderStatus.PAYMENT_PENDING;
      initialPaymentStatus = PaymentStatus.PENDING;
    } else if (walletAmountUsed > 0 && input.paymentMethod === 'COD') {
      resolvedPaymentMethod = PaymentMethod.WALLET_COD;
      initialOrderStatus = OrderStatus.MERCHANT_ACCEPTED;
      initialPaymentStatus = PaymentStatus.PENDING;
    } else if (input.paymentMethod === 'COD') {
      resolvedPaymentMethod = PaymentMethod.COD;
      initialOrderStatus = OrderStatus.MERCHANT_ACCEPTED;
      initialPaymentStatus = PaymentStatus.PENDING;
    } else {
      resolvedPaymentMethod = PaymentMethod.RAZORPAY;
      initialOrderStatus = OrderStatus.PAYMENT_PENDING;
      initialPaymentStatus = PaymentStatus.PENDING;
    }

    return {
      walletAmountUsed,
      rewardPointsUsed: pointsToRedeem,
      pointsDiscount,
      amountDue: round(input.grandTotal - pointsDiscount),
      razorpayAmount,
      resolvedPaymentMethod,
      initialOrderStatus,
      initialPaymentStatus,
    };
  }

  async applyCheckoutDeductions(
    tx: TxClient,
    walletId: string,
    orderId: string,
    walletAmountUsed: number,
    rewardPointsUsed: number,
  ) {
    if (rewardPointsUsed > 0) {
      await this.reward.redeemPoints(tx, walletId, rewardPointsUsed, orderId);
    }
    if (walletAmountUsed > 0) {
      await this.wallet.debitWallet(tx, walletId, walletAmountUsed, {
        referenceType: 'order',
        referenceId: orderId,
        description: `Payment for order ${orderId}`,
        idempotencyKey: `wallet-debit:${orderId}`,
      });
    }
  }

  async processOrderCompleted(orderId: string): Promise<void> {
    await this.reward.creditPointsForOrder(orderId);
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
