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
export declare class WalletLoyaltyCheckoutService {
    private readonly wallet;
    private readonly reward;
    private readonly config;
    constructor(wallet: WalletService, reward: RewardService, config: RewardConfigService);
    computeCheckoutPayment(input: CheckoutWalletInput): Promise<CheckoutWalletResult>;
    applyCheckoutDeductions(tx: TxClient, walletId: string, orderId: string, walletAmountUsed: number, rewardPointsUsed: number): Promise<void>;
    processOrderCompleted(orderId: string): Promise<void>;
}
export {};
