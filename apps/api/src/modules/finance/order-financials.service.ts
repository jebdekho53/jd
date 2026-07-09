import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma, OrderFinancialSnapshot } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FinanceCommissionService } from './finance-commission.service';
import { LedgerService } from './ledger.service';
import { decimalToNumber, roundMoney } from '../settlement/settlement.utils';

const DEFAULT_GST_RATE = 5;
const RIDER_BASE_FEE = 25;
const RIDER_PER_KM = 8;

export interface FreezeOrderInput {
  orderId: string;
  storeId: string;
  subtotal: number;
  discountAmount: number;
  offerSubsidy?: number;
  merchantContribution?: number;
  platformContribution?: number;
  deliveryFee: number;
  /** Platform delivery fee the merchant sponsors (free-delivery threshold met).
   *  Deducted from merchant payout; the platform never subsidises delivery. */
  merchantDeliveryContribution?: number;
  taxAmount?: number;
  /** Actual amount payable by the buyer (order total). Used for the cash/receivable
   *  ledger so it always matches what is collected, regardless of inclusive/exclusive
   *  GST or catalog savings baked into the discount. */
  totalAmount?: number;
  paymentMethod: PaymentMethod;
}

@Injectable()
export class OrderFinancialsService {
  private readonly logger = new Logger(OrderFinancialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commission: FinanceCommissionService,
    private readonly ledger: LedgerService,
  ) {}

  async freezeOnOrderCreate(input: FreezeOrderInput): Promise<void> {
    const existing = await this.prisma.orderFinancialSnapshot.findUnique({
      where: { orderId: input.orderId },
    });
    if (existing) return;

    const store = await this.prisma.store.findUnique({
      where: { id: input.storeId },
      select: {
        id: true,
        name: true,
        slug: true,
        deliveryFee: true,
        minOrderAmount: true,
        cityId: true,
      },
    });
    if (!store) return;

    const resolution = await this.commission.resolveForOrder(input.storeId, input.orderId);
    const gross = input.subtotal;
    const commissionAmount = roundMoney((gross * resolution.commissionPercent) / 100);
    // Merchant sponsors the delivery fee when they offer free delivery above
    // their threshold — deduct it from their payout so the platform stays whole.
    const merchantDeliveryContribution = input.merchantDeliveryContribution ?? 0;
    const netMerchant = roundMoney(gross - commissionAmount - merchantDeliveryContribution);
    const taxAmount = input.taxAmount ?? roundMoney((gross * DEFAULT_GST_RATE) / 100);
    const deliveryFee = input.deliveryFee;
    // Platform collects the customer fee AND any merchant-sponsored fee, and pays
    // the rider from that pool. Self-delivery contributes neither (merchant delivers).
    const deliveryCollected = roundMoney(deliveryFee + merchantDeliveryContribution);
    const platformEarnings = roundMoney(commissionAmount + deliveryCollected);
    const riderPayout = this.estimateRiderPayout(deliveryCollected);

    const offerSubsidy = input.offerSubsidy ?? input.discountAmount * 0.5;
    const merchantContribution = input.merchantContribution ?? offerSubsidy * 0.6;
    const platformContribution = input.platformContribution ?? offerSubsidy - merchantContribution;

    await this.prisma.$transaction(async (tx) => {
      await tx.orderFinancialSnapshot.create({
        data: {
          orderId: input.orderId,
          subtotal: gross,
          discountAmount: input.discountAmount,
          offerSubsidy,
          merchantContribution,
          platformContribution,
          deliveryFee,
          taxAmount,
          commissionPercent: resolution.commissionPercent,
          commissionAmount,
          netMerchantEarnings: netMerchant,
          netPlatformEarnings: platformEarnings,
          riderPayoutAmount: riderPayout,
          commissionRuleId: resolution.commissionRuleId,
          storeSnapshot: store as Prisma.InputJsonValue,
        },
      });

      await tx.taxRecord.create({
        data: {
          orderId: input.orderId,
          taxType: 'GST',
          taxableAmount: gross,
          taxAmount,
          gstRate: DEFAULT_GST_RATE,
          periodMonth: new Date().toISOString().slice(0, 7),
        },
      });
    });

    const isCod =
      input.paymentMethod === PaymentMethod.COD ||
      input.paymentMethod === PaymentMethod.WALLET_COD;
    const deferOnlineLedger =
      input.paymentMethod === PaymentMethod.RAZORPAY ||
      input.paymentMethod === PaymentMethod.WALLET_RAZORPAY;
    // Prefer the real order total (what the buyer actually pays) so the cash/
    // receivable ledger matches collection exactly. Fall back to the derived
    // figure only when the caller doesn't supply it.
    const paidAmount =
      input.totalAmount ?? gross + deliveryFee - input.discountAmount + taxAmount;

    if (!deferOnlineLedger) {
      void this.ledger.recordOrderPayment(input.orderId, paidAmount, isCod).catch((err) => {
        this.logger.warn(`Ledger order payment failed: ${(err as Error).message}`);
      });
    }
    void this.ledger.recordTaxAccrual(input.orderId, taxAmount, gross).catch(() => {});

    this.logger.debug({ orderId: input.orderId, commission: resolution }, 'Order financials frozen');
  }

  /** Post ledger entry when online Razorpay payment is verified (idempotent). */
  async recordOnlinePaymentConfirmed(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        paymentMethod: true,
        paymentStatus: true,
        totalAmount: true,
        deliveryFee: true,
        discountAmount: true,
        taxAmount: true,
      },
    });
    if (!order || order.paymentStatus !== PaymentStatus.PAID) return;

    const method = order.paymentMethod;
    if (method !== PaymentMethod.RAZORPAY && method !== PaymentMethod.WALLET_RAZORPAY) return;

    // Cash/receivable ledger must equal what the buyer actually paid.
    const paidAmount = decimalToNumber(order.totalAmount);

    await this.ledger.recordOrderPayment(orderId, paidAmount, false);
  }

  async getOrderFinancials(orderId: string) {
    const snap = await this.prisma.orderFinancialSnapshot.findUnique({ where: { orderId } });
    if (!snap) return null;
    return this.formatFinancials(snap);
  }

  async getOrderFinancialsForMerchant(orderId: string, merchantUserId: string) {
    const owned = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        store: { merchantProfile: { userId: merchantUserId } },
      },
      select: { id: true },
    });
    if (!owned) return null;

    const snap = await this.prisma.orderFinancialSnapshot.findUnique({ where: { orderId } });
    if (!snap) return null;
    return this.formatFinancials(snap);
  }

  private formatFinancials(snap: OrderFinancialSnapshot) {
    return {
      orderId: snap.orderId,
      subtotal: decimalToNumber(snap.subtotal),
      discountAmount: decimalToNumber(snap.discountAmount),
      offerSubsidy: decimalToNumber(snap.offerSubsidy),
      merchantContribution: decimalToNumber(snap.merchantContribution),
      platformContribution: decimalToNumber(snap.platformContribution),
      deliveryFee: decimalToNumber(snap.deliveryFee),
      taxAmount: decimalToNumber(snap.taxAmount),
      commissionPercent: decimalToNumber(snap.commissionPercent),
      commissionAmount: decimalToNumber(snap.commissionAmount),
      netMerchantEarnings: decimalToNumber(snap.netMerchantEarnings),
      netPlatformEarnings: decimalToNumber(snap.netPlatformEarnings),
      riderPayoutAmount: decimalToNumber(snap.riderPayoutAmount),
      frozenAt: snap.frozenAt.toISOString(),
      storeSnapshot: snap.storeSnapshot,
    };
  }

  private estimateRiderPayout(deliveryFee: number): number {
    return roundMoney(Math.min(deliveryFee * 0.7, RIDER_BASE_FEE + RIDER_PER_KM * 2));
  }
}
