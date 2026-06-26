import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CheckoutStatus,
  DomainEventType,
  OrderActorType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  RewardTransactionType,
  StoreStatus,
  WalletTransactionType,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { CartService } from '../cart/cart.service';
import { ReservationService } from './reservation.service';
import { OrderCacheService } from '../order/order-cache.service';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';
import { StorePromotionService } from '../promotion/store-promotion.service';
import { GeospatialService } from '../geospatial/geospatial.service';
import { WalletLoyaltyCheckoutService } from '../wallet-loyalty/wallet-loyalty-checkout.service';
import { ReferralService } from '../wallet-loyalty/referral.service';
import { WalletService } from '../wallet-loyalty/wallet.service';
import { OrderFinancialsService } from '../finance/order-financials.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';
import { SmartFulfillmentService } from '../fulfillment-network/smart-fulfillment.service';
import { CorporateWalletService } from '../corporate/corporate-wallet.service';
import { ApprovalService } from '../corporate/approval.service';
import { PurchaseRequestStatus } from '@prisma/client';
import { EmailNotificationService } from '../email/email-notification.service';
import { LocationDirectoryService } from '../location-directory/location-directory.service';

const CHECKOUT_TTL_MINUTES = 15;

function generateOrderNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `JD-${ymd}-${rand}`;
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly reservation: ReservationService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly orderCache: OrderCacheService,
    private readonly promotions: StorePromotionService,
    private readonly geospatial: GeospatialService,
    private readonly walletCheckout: WalletLoyaltyCheckoutService,
    private readonly referral: ReferralService,
    private readonly wallet: WalletService,
    private readonly orderFinancials: OrderFinancialsService,
    private readonly trustSafety: TrustSafetyHookService,
    private readonly smartFulfillment: SmartFulfillmentService,
    private readonly corporateWallet: CorporateWalletService,
    private readonly corporateApproval: ApprovalService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly locations: LocationDirectoryService,
  ) {}

  // ── Initiate checkout (Razorpay / online payment) ──────────────────────────

  async initiateCheckout(
    userId: string,
    dto: InitiateCheckoutDto,
    ipAddress?: string,
  ) {
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    await this.validateCartForCheckout(cart);
    await this.validateDeliveryAddress(dto.deliveryAddress);
    await this.geospatial.validateCheckoutLocation(
      cart.storeId,
      dto.deliveryAddress.lat,
      dto.deliveryAddress.lng,
      dto.deliveryAddress.pincode,
    );

    if (dto.corporatePurchaseRequestId) {
      await this.validateCorporatePurchaseRequest(userId, dto.corporatePurchaseRequestId, cart.totals.grandTotal);
    }

    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!buyerProfile) throw new BadRequestException('Buyer profile not found');

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const cartSnap = JSON.stringify({
      storeId: cart.storeId,
      items: cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        productName: i.product.name,
        variantName: i.variant.name,
        sku: i.variant.sku,
      })),
      totals: cart.totals,
      promo: cart.totals.promo,
      appliedCouponCode: cart.appliedCouponCode,
      corporatePurchaseRequestId: dto.corporatePurchaseRequestId,
    });

    const address = dto.deliveryAddress;

    // ── Create checkout + reserve inventory atomically ─────────────────────
    const checkout = await this.prisma.$transaction(async (tx) => {
      const c = await tx.checkout.create({
        data: {
          buyerProfileId: buyerProfile.id,
          storeId: cart.storeId,
          status: CheckoutStatus.INITIATED,
          cartSnapshot: cartSnap,
          totalAmount: cart.totals.grandTotal,
          deliveryAddress: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            pincode: address.pincode,
          },
          deliveryLat: address.lat,
          deliveryLng: address.lng,
          buyerNote: dto.buyerNote,
          expiresAt,
        },
      });
      return c;
    });

    // Reserve inventory (outside the checkout-create transaction so failures
    // don't leave orphan checkouts — handled by cleanup job if partially done)
    try {
      await this.reservation.reserveInventory(
        checkout.id,
        cart.items.map((i) => ({
          variantId: i.variantId,
          productId: i.productId,
          quantity: i.quantity,
        })),
        userId,
        ipAddress,
      );
    } catch (err) {
      // Reservation failed — expire the checkout and re-throw
      await this.prisma.checkout.update({
        where: { id: checkout.id },
        data: { status: CheckoutStatus.EXPIRED },
      });
      throw err;
    }

    // Create pending order (spec: Reservation succeeds → Create Pending Order → Payment)
    const order = await this.createOrderFromCheckout(
      checkout.id,
      cart,
      buyerProfile.id,
      address,
      dto.buyerNote,
      PaymentMethod.RAZORPAY,
      {
        walletAmountToUse: dto.walletAmountToUse,
        rewardPointsToRedeem: dto.rewardPointsToRedeem,
        referralCode: dto.referralCode,
        deviceFingerprint: dto.deviceFingerprint,
      },
    );

    // Link reservations to pending order — stock held until delivery
    await this.reservation.linkReservationsToOrder(checkout.id, order.id);

    // Mark checkout as RESERVED + link the pending order
    const reserved = await this.prisma.checkout.update({
      where: { id: checkout.id },
      data: { status: CheckoutStatus.RESERVED, orderId: order.id },
    });

    // Clear the buyer's cart after successful reservation
    await this.cartService.clearCart(userId);

    await Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'CHECKOUT_CREATED',
        resourceType: 'checkout',
        resourceId: checkout.id,
        ipAddress,
        metadata: {
          storeId: cart.storeId,
          itemCount: cart.items.length,
          totalAmount: cart.totals.grandTotal,
          orderId: order.id,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.CHECKOUT_CREATED,
        'checkout',
        checkout.id,
        { buyerProfileId: buyerProfile.id, storeId: cart.storeId, total: cart.totals.grandTotal, orderId: order.id },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log({ userId, checkoutId: checkout.id, orderId: order.id }, 'Checkout initiated');

    return {
      id: reserved.id,
      checkoutId: reserved.id,
      orderId: order.id,
      status: reserved.status,
      totalAmount: Number(reserved.totalAmount),
      expiresAt: reserved.expiresAt,
    };
  }

  // ── COD checkout ───────────────────────────────────────────────────────────
  //
  // Reserve inventory + create order in one step. No payment gateway needed.

  async initiateCodCheckout(
    userId: string,
    dto: InitiateCheckoutDto,
    ipAddress?: string,
  ) {
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    await this.validateCartForCheckout(cart);
    await this.validateDeliveryAddress(dto.deliveryAddress);
    await this.geospatial.validateCheckoutLocation(
      cart.storeId,
      dto.deliveryAddress.lat,
      dto.deliveryAddress.lng,
      dto.deliveryAddress.pincode,
    );

    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!buyerProfile) throw new BadRequestException('Buyer profile not found');

    const codCheck = await this.trustSafety.beforeCodCheckout(userId);
    if (!codCheck.allowed) {
      throw new BadRequestException(codCheck.reason ?? 'COD not available');
    }

    if (dto.corporatePurchaseRequestId) {
      await this.validateCorporatePurchaseRequest(userId, dto.corporatePurchaseRequestId, cart.totals.grandTotal);
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const address = dto.deliveryAddress;

    const cartSnap = JSON.stringify({
      storeId: cart.storeId,
      items: cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        productName: i.product.name,
        variantName: i.variant.name,
        sku: i.variant.sku,
      })),
      totals: cart.totals,
      promo: cart.totals.promo,
      appliedCouponCode: cart.appliedCouponCode,
      corporatePurchaseRequestId: dto.corporatePurchaseRequestId,
    });

    const checkout = await this.prisma.checkout.create({
      data: {
        buyerProfileId: buyerProfile.id,
        storeId: cart.storeId,
        status: CheckoutStatus.INITIATED,
        cartSnapshot: cartSnap,
        totalAmount: cart.totals.grandTotal,
        deliveryAddress: { line1: address.line1, line2: address.line2, city: address.city, pincode: address.pincode },
        deliveryLat: address.lat,
        deliveryLng: address.lng,
        buyerNote: dto.buyerNote,
        expiresAt,
      },
    });

    // Reserve inventory
    try {
      await this.reservation.reserveInventory(
        checkout.id,
        cart.items.map((i) => ({
          variantId: i.variantId,
          productId: i.productId,
          quantity: i.quantity,
        })),
        userId,
        ipAddress,
      );
    } catch (err) {
      await this.prisma.checkout.update({
        where: { id: checkout.id },
        data: { status: CheckoutStatus.EXPIRED },
      });
      throw err;
    }

    await this.prisma.checkout.update({
      where: { id: checkout.id },
      data: { status: CheckoutStatus.RESERVED },
    });

    // ── Create Order immediately (COD) ──────────────────────────────────────
    const order = await this.createOrderFromCheckout(
      checkout.id,
      cart,
      buyerProfile.id,
      address,
      dto.buyerNote,
      PaymentMethod.COD,
      {
        walletAmountToUse: dto.walletAmountToUse,
        rewardPointsToRedeem: dto.rewardPointsToRedeem,
        referralCode: dto.referralCode,
        deviceFingerprint: dto.deviceFingerprint,
        corporatePurchaseRequestId: dto.corporatePurchaseRequestId,
      },
    );

    if (dto.corporatePurchaseRequestId) {
      await this.settleCorporateWallet(userId, dto.corporatePurchaseRequestId, cart.totals.grandTotal);
    }

    // Link reservations to order — stock stays reserved until delivery or cancellation
    await this.reservation.linkReservationsToOrder(checkout.id, order.id);

    // Mark checkout as COMPLETED + link to order
    await this.prisma.checkout.update({
      where: { id: checkout.id },
      data: { status: CheckoutStatus.COMPLETED, orderId: order.id },
    });

    // Clear cart
    await this.cartService.clearCart(userId);

    await Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'ORDER_CREATED',
        resourceType: 'order',
        resourceId: order.id,
        ipAddress,
        metadata: {
          checkoutId: checkout.id,
          orderNumber: order.orderNumber,
          paymentMethod: 'COD',
          totalAmount: cart.totals.grandTotal,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.ORDER_CREATED,
        'order',
        order.id,
        { checkoutId: checkout.id, buyerProfileId: buyerProfile.id, storeId: cart.storeId },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        buyerProfileId: buyerProfile.id,
        storeId: cart.storeId,
        status: order.status,
      },
      'ORDER_CREATED (COD)',
    );

    void this.emailNotifications.sendOrderConfirmation(order.id).catch((err) => {
      this.logger.error({ err, orderId: order.id }, 'Order confirmation email failed');
    });

    return { orderId: order.id, orderNumber: order.orderNumber, status: order.status };
  }

  // ── Get checkout ─────────────────────────────────────────────────────────

  async getCheckout(userId: string, checkoutId: string) {
    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!buyerProfile) throw new NotFoundException('Buyer profile not found');

    const checkout = await this.prisma.checkout.findUnique({
      where: { id: checkoutId },
      include: { reservations: true },
    });

    if (!checkout) throw new NotFoundException('Checkout not found');
    if (checkout.buyerProfileId !== buyerProfile.id) {
      throw new ForbiddenException('Checkout does not belong to you');
    }

    return {
      id: checkout.id,
      status: checkout.status,
      totalAmount: Number(checkout.totalAmount),
      orderId: checkout.orderId,
      expiresAt: checkout.expiresAt,
      buyerNote: checkout.buyerNote,
    };
  }

  // ── Confirm order after successful payment (called by RazorpayService) ────

  async confirmOrder(
    checkoutId: string,
    paymentMethod: PaymentMethod,
    userId: string,
    ipAddress?: string,
  ) {
    const checkout = await this.prisma.checkout.findUnique({
      where: { id: checkoutId },
      include: { buyerProfile: { select: { id: true } } },
    });
    if (!checkout) throw new NotFoundException('Checkout not found');
    if (checkout.status !== CheckoutStatus.RESERVED) {
      throw new BadRequestException(`Cannot confirm order for checkout in status: ${checkout.status}`);
    }

    // Re-hydrate cart totals from snapshot
    const snap = JSON.parse(checkout.cartSnapshot as string);

    const order = await this.createOrderFromCheckout(
      checkoutId,
      snap,
      checkout.buyerProfileId,
      checkout.deliveryAddress as any,
      checkout.buyerNote ?? undefined,
      paymentMethod,
    );

    await this.reservation.linkReservationsToOrder(checkoutId, order.id);

    await this.prisma.checkout.update({
      where: { id: checkoutId },
      data: { status: CheckoutStatus.COMPLETED, orderId: order.id },
    });

    await Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'ORDER_CREATED',
        resourceType: 'order',
        resourceId: order.id,
        ipAddress,
        metadata: {
          checkoutId,
          orderNumber: order.orderNumber,
          paymentMethod,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.ORDER_CREATED,
        'order',
        order.id,
        { checkoutId, buyerProfileId: checkout.buyerProfileId, storeId: checkout.storeId },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    void this.orderCache.invalidateAll(order.id);
    return order;
  }

  private async createOrderFromCheckout(
    checkoutId: string,
    cart: any,
    buyerProfileId: string,
    address: any,
    buyerNote?: string,
    paymentMethodInput: PaymentMethod = PaymentMethod.RAZORPAY,
    walletOpts?: {
      walletAmountToUse?: number;
      rewardPointsToRedeem?: number;
      referralCode?: string;
      deviceFingerprint?: string;
      corporatePurchaseRequestId?: string;
    },
  ) {
    const totals = cart.totals ?? {
      subtotal: 0,
      discount: 0,
      catalogSavings: 0,
      offerDiscount: 0,
      couponDiscount: 0,
      deliveryDiscount: 0,
      totalSavings: 0,
      deliveryFee: 0,
      tax: 0,
      grandTotal: 0,
      promo: null,
    };
    const items: any[] = cart.items ?? [];
    const promoDiscount = (totals.offerDiscount ?? 0) + (totals.couponDiscount ?? 0);
    const discountAmount = promoDiscount + (totals.catalogSavings ?? totals.discount ?? 0);
    const couponId = totals.promo?.appliedCoupon?.id ?? null;
    const promotionId = totals.promo?.appliedPromotion?.id ?? null;
    const offerId = totals.promo?.appliedOffer?.id ?? null;
    const cashbackAmount = totals.promo?.cashbackAmount ?? 0;
    const rewardPointsBonus = totals.promo?.rewardPointsBonus ?? 0;
    const gmvImpact = totals.grandTotal ?? 0;

    const pmBase = paymentMethodInput === PaymentMethod.COD ? 'COD' : 'RAZORPAY';
    const paymentPlan = await this.walletCheckout.computeCheckoutPayment({
      buyerProfileId,
      grandTotal: totals.grandTotal,
      walletAmountToUse: walletOpts?.walletAmountToUse,
      rewardPointsToRedeem: walletOpts?.rewardPointsToRedeem,
      paymentMethod: pmBase,
    });

    const buyerWallet = await this.wallet.getOrCreateWallet(
      buyerProfileId,
      walletOpts?.referralCode,
    );
    if (walletOpts?.referralCode && !buyerWallet.referredById) {
      try {
        await this.referral.applyReferralCode(
          buyerProfileId,
          walletOpts.referralCode,
          walletOpts.deviceFingerprint,
        );
      } catch {
        // non-fatal at checkout
      }
    }

    const orderDiscount = discountAmount + paymentPlan.pointsDiscount;

    return this.prisma.$transaction(async (tx) => {
      let orderNumber: string;
      let attempts = 0;

      do {
        orderNumber = generateOrderNumber();
        attempts++;
        if (attempts > 5) throw new Error('Could not generate unique order number');
      } while (await tx.order.findUnique({ where: { orderNumber } }));

      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerProfileId,
          storeId: cart.storeId,
          status: paymentPlan.initialOrderStatus,
          paymentMethod: paymentPlan.resolvedPaymentMethod,
          paymentStatus: paymentPlan.initialPaymentStatus,
          subtotal: totals.subtotal,
          discountAmount: orderDiscount,
          deliveryFee: totals.deliveryFee ?? 0,
          taxAmount: totals.tax ?? 0,
          totalAmount: paymentPlan.amountDue,
          walletAmountUsed: paymentPlan.walletAmountUsed,
          rewardPointsUsed: paymentPlan.rewardPointsUsed,
          razorpayAmount: paymentPlan.razorpayAmount > 0 ? paymentPlan.razorpayAmount : null,
          couponId,
          deliveryAddress: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            pincode: address.pincode,
          },
          deliveryLat: address.lat ?? 0,
          deliveryLng: address.lng ?? 0,
          buyerNote,
          idempotencyKey: checkoutId,
          ...(paymentPlan.initialPaymentStatus === PaymentStatus.PAID && { paidAt: new Date() }),
          items: {
            create: items.map((i: any) => ({
              productId: i.productId,
              variantId: i.variantId,
              productName: i.productName ?? '',
              variantName: i.variantName ?? '',
              sku: i.sku ?? '',
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: 0,
              tax: 0,
              totalPrice: i.unitPrice * i.quantity,
            })),
          },
        },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          note:
            paymentPlan.resolvedPaymentMethod === PaymentMethod.COD ||
            paymentPlan.resolvedPaymentMethod === PaymentMethod.WALLET_COD
              ? 'COD order created'
              : paymentPlan.resolvedPaymentMethod === PaymentMethod.WALLET
                ? 'Order paid via wallet'
                : 'Order created, awaiting payment',
          actorType: OrderActorType.BUYER,
        },
      });

      await this.promotions.redeemOnOrder(
        tx,
        order.id,
        buyerProfileId,
        couponId,
        promotionId,
        offerId,
        totals.couponDiscount ?? 0,
        totals.offerDiscount ?? 0,
        cashbackAmount,
        rewardPointsBonus,
        gmvImpact,
      );

      await this.walletCheckout.applyCheckoutDeductions(
        tx,
        buyerWallet.id,
        order.id,
        paymentPlan.walletAmountUsed,
        paymentPlan.rewardPointsUsed,
      );

      return order;
    }).then(async (order) => {
      void this.orderFinancials
        .freezeOnOrderCreate({
          orderId: order.id,
          storeId: cart.storeId,
          subtotal: totals.subtotal,
          discountAmount: orderDiscount,
          offerSubsidy: totals.offerDiscount ?? 0,
          deliveryFee: totals.deliveryFee ?? 0,
          taxAmount: totals.tax ?? 0,
          paymentMethod: order.paymentMethod,
        })
        .catch((err) => this.logger.warn(`Financial freeze failed: ${(err as Error).message}`));

      if (paymentPlan.walletAmountUsed > 0) {
        await this.wallet.emitWalletDebited(
          buyerWallet.id,
          buyerProfileId,
          paymentPlan.walletAmountUsed,
          order.id,
        );
      }
      if (cashbackAmount > 0) {
        await this.prisma.$transaction(async (tx) => {
          await this.wallet.creditWallet(tx, buyerWallet.id, cashbackAmount, WalletTransactionType.CREDIT, {
            description: `Offer cashback for order ${order.orderNumber}`,
            referenceType: 'order',
            referenceId: order.id,
            idempotencyKey: `offer-cashback:${order.id}`,
          });
        });
      }
      if (rewardPointsBonus > 0) {
        await this.prisma.$transaction(async (tx) => {
          const wallet = await tx.buyerWallet.findUnique({ where: { id: buyerWallet.id } });
          if (!wallet) return;
          const after = wallet.rewardPoints + rewardPointsBonus;
          await tx.buyerWallet.update({
            where: { id: buyerWallet.id },
            data: { rewardPoints: after, lifetimePoints: { increment: rewardPointsBonus } },
          });
          await tx.rewardTransaction.create({
            data: {
              walletId: buyerWallet.id,
              type: RewardTransactionType.EARN,
              points: rewardPointsBonus,
              pointsAfter: after,
              orderId: order.id,
              description: 'Campaign offer bonus points',
              idempotencyKey: `offer-bonus:${order.id}`,
            },
          });
        });
      }

      void this.smartFulfillment.allocateOrder(order.id).catch((err) =>
        this.logger.warn(`Fulfillment allocation failed for ${order.id}: ${(err as Error).message}`),
      );

      return order;
    });
  }

  // ── Private: validate cart before checkout ─────────────────────────────────

  private async validateDeliveryAddress(address: InitiateCheckoutDto['deliveryAddress']): Promise<void> {
    await this.locations.validatePincode({
      pincode: address.pincode,
      locationCityId: address.locationCityId,
      locationAreaId: address.locationAreaId,
    });
  }

  private async validateCartForCheckout(cart: { storeId: string; items: any[] }): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: {
        id: cart.storeId,
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
      },
    });
    if (!store) throw new BadRequestException('Store is no longer accepting orders');

    for (const item of cart.items) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: item.variantId,
          isActive: true,
          product: { id: item.productId, isActive: true, deletedAt: null },
        },
        include: { inventory: true },
      });

      if (!variant) {
        throw new BadRequestException(
          `Product/variant no longer available: ${item.variant?.name ?? item.variantId}`,
        );
      }

      const available = variant.inventory
        ? variant.inventory.availableQty
        : 0;

      if (available < item.quantity) {
        throw new ConflictException({
          code: 'INVENTORY_CHANGED',
          message: `Only ${available} unit(s) available for "${item.product?.name ?? item.variantId}"`,
        });
      }
    }
  }

  private async validateCorporatePurchaseRequest(
    userId: string,
    requestId: string,
    amount: number,
  ): Promise<void> {
    const employee = await this.prisma.corporateUser.findFirst({ where: { userId } });
    if (!employee) throw new BadRequestException('Corporate account required');

    const req = await this.prisma.purchaseRequest.findFirst({
      where: { id: requestId, employeeId: employee.id },
      include: { employee: { include: { account: { include: { approvalWorkflows: true } } } } },
    });
    if (!req) throw new BadRequestException('Purchase request not found');
    if (req.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException('Purchase request not approved');
    }
    if (Number(req.amount) < amount) {
      throw new BadRequestException('Purchase request amount insufficient');
    }

    const limit = Number(req.employee.account.approvalWorkflows[0]?.approvalLimit ?? 0);
    if (this.corporateApproval.needsApproval(amount, limit) && req.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException('Order requires corporate approval');
    }
  }

  private async settleCorporateWallet(userId: string, requestId: string, amount: number) {
    const employee = await this.prisma.corporateUser.findFirst({ where: { userId } });
    if (!employee) return;
    await this.corporateWallet.debit(employee.accountId, amount);
    await this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: PurchaseRequestStatus.APPROVED },
    });
  }
}
