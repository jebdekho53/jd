import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FoodKitchenStatus,
  MenuItemAvailability,
  OrderActorType,
  OrderStatus,
  OrderVertical,
  PaymentMethod,
  PaymentStatus,
  DomainEventType,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { FoodCartService } from './food-cart.service';
import { InitiateFoodCheckoutDto } from './dto/initiate-food-checkout.dto';
import { GeospatialService } from '../geospatial/geospatial.service';
import { OrderFinancialsService } from '../finance/order-financials.service';
import { MarketingEventService } from '../crm/marketing-event.service';

const CHECKOUT_TTL_MINUTES = 15;
const FOOD_CHECKOUT_PENDING = 'PENDING';
const FOOD_CHECKOUT_PROCESSING = 'PROCESSING';
const FOOD_CHECKOUT_COMPLETED = 'COMPLETED';

function generateOrderNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `JDF-${ymd}-${rand}`;
}

type FoodCartSnapshot = {
  storeId: string;
  items: {
    menuItemId: string;
    variantId: string | null;
    comboId?: string | null;
    itemName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    specialInstructions: string | null;
    addons: { name: string; price: number }[];
  }[];
  totals: {
    subtotal: number;
    packagingFee: number;
    deliveryFee: number;
    tax: number;
    grandTotal: number;
  };
  dto: InitiateFoodCheckoutDto;
  totalAmount: number;
  tipAmount: number;
  couponDiscount: number;
};

@Injectable()
export class FoodCheckoutService {
  private readonly logger = new Logger(FoodCheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly foodCart: FoodCartService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly geospatial: GeospatialService,
    @Inject(forwardRef(() => OrderFinancialsService))
    private readonly orderFinancials: OrderFinancialsService,
    private readonly marketingEvents: MarketingEventService,
  ) {}

  async initiateCheckout(userId: string, dto: InitiateFoodCheckoutDto, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        select: { id: true, orderNumber: true, status: true },
      });
      if (existingOrder) {
        return {
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          status: existingOrder.status,
        };
      }

      const existingCheckout = await this.prisma.foodCheckout.findUnique({
        where: { idempotencyKey },
      });
      if (existingCheckout) {
        if (existingCheckout.status === FOOD_CHECKOUT_COMPLETED && existingCheckout.orderId) {
          const order = await this.prisma.order.findUnique({
            where: { id: existingCheckout.orderId },
          });
          if (order) {
            return {
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
            };
          }
        }
        return {
          checkoutId: existingCheckout.id,
          totalAmount: Number(existingCheckout.totalAmount),
          expiresAt: existingCheckout.expiresAt,
        };
      }
    }

    const cart = await this.foodCart.getFoodCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Food cart is empty');
    }

    const minOrder = this.effectiveMinOrder(cart);
    if (cart.totals.subtotal < minOrder) {
      throw new BadRequestException(`Minimum order amount is ₹${minOrder}`);
    }

    await this.assertStoreAcceptingOrders(cart.storeId);
    await this.validateCartAvailability(cart.items.map((i) => i.menuItemId));

    await this.geospatial.validateCheckoutLocation(
      cart.storeId,
      dto.deliveryLat,
      dto.deliveryLng,
      typeof dto.deliveryAddress.pincode === 'string' ? dto.deliveryAddress.pincode : undefined,
    );

    const tipAmount = dto.tipAmount ?? 0;
    // Food has no coupon-validation system yet (unlike grocery's PromotionPricingService,
    // which computes the discount server-side) — never trust a client-supplied amount here.
    const couponDiscount = 0;
    const totalAmount = cart.totals.grandTotal + tipAmount - couponDiscount;

    const buyerProfile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!buyerProfile) throw new NotFoundException('Buyer profile not found');

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);

    if (dto.paymentMethod === PaymentMethod.COD) {
      // Self-delivery stores have no rider to act as the cash-collection
      // intermediary that normally hands the platform its commission share —
      // see checkout.service.ts's initiateCodCheckout for the same guard on
      // the marketplace (grocery) path.
      const store = await this.prisma.store.findUnique({
        where: { id: cart.storeId },
        select: { deliveryMode: true },
      });
      if (store?.deliveryMode === 'SELF') {
        throw new BadRequestException(
          'Cash on delivery is not available for this store — please pay online.',
        );
      }
      return this.createFoodOrderFromCart({
        buyerProfileId: buyerProfile.id,
        userId,
        cart,
        dto,
        totalAmount,
        tipAmount,
        couponDiscount,
        idempotencyKey,
      });
    }

    const cartSnapshot: FoodCartSnapshot = {
      storeId: cart.storeId,
      items: cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        variantId: item.variantId,
        itemName: item.menuItem.name,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        specialInstructions: item.specialInstructions,
        addons: item.addons,
      })),
      totals: cart.totals,
      dto,
      totalAmount,
      tipAmount,
      couponDiscount,
    };

    const checkout = await this.prisma.foodCheckout.create({
      data: {
        buyerProfileId: buyerProfile.id,
        storeId: cart.storeId,
        subtotal: cart.totals.subtotal,
        packagingFee: cart.totals.packagingFee,
        deliveryFee: cart.totals.deliveryFee,
        taxAmount: cart.totals.tax,
        discountAmount: couponDiscount,
        tipAmount,
        totalAmount,
        deliveryAddress: dto.deliveryAddress as Prisma.InputJsonValue,
        deliveryLat: dto.deliveryLat,
        deliveryLng: dto.deliveryLng,
        scheduledDeliveryAt: dto.scheduledDeliveryAt ? new Date(dto.scheduledDeliveryAt) : null,
        specialInstructions: dto.specialInstructions,
        restaurantNote: dto.restaurantNote,
        paymentMethod: dto.paymentMethod,
        idempotencyKey,
        cartSnapshot: cartSnapshot as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return { checkoutId: checkout.id, totalAmount, expiresAt };
  }

  async createPaidOrderFromCheckout(opts: {
    checkoutId: string;
    buyerProfileId: string;
    userId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string | null;
    razorpaySignature?: string;
  }) {
    const checkout = await this.prisma.foodCheckout.findUnique({
      where: { id: opts.checkoutId },
    });
    if (!checkout) throw new NotFoundException('Food checkout not found');
    if (checkout.status === FOOD_CHECKOUT_COMPLETED && checkout.orderId) {
      const existing = await this.prisma.order.findUnique({ where: { id: checkout.orderId } });
      if (!existing) throw new NotFoundException('Order not found');
      return { orderId: existing.id, orderNumber: existing.orderNumber };
    }

    const snapshot = checkout.cartSnapshot as FoodCartSnapshot | null;
    if (!snapshot?.items?.length) {
      throw new BadRequestException('Food checkout cart snapshot is invalid');
    }

    // Stamped onto the order so DeliveryDispatchService correctly skips rider/3PL
    // dispatch for self-delivery stores — without this every food order defaulted
    // to PLATFORM regardless of the store's actual setting.
    const checkoutStore = await this.prisma.store.findUnique({
      where: { id: snapshot.storeId },
      select: { deliveryMode: true },
    });

    const order = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.foodCheckout.updateMany({
        where: { id: checkout.id, status: FOOD_CHECKOUT_PENDING },
        data: { status: FOOD_CHECKOUT_PROCESSING },
      });
      if (claimed.count === 0) {
        const current = await tx.foodCheckout.findUnique({ where: { id: checkout.id } });
        if (current?.status === FOOD_CHECKOUT_COMPLETED && current.orderId) {
          const existing = await tx.order.findUnique({ where: { id: current.orderId } });
          if (existing) return existing;
        }
        throw new ConflictException('Food checkout is already being processed');
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerProfileId: opts.buyerProfileId,
          storeId: snapshot.storeId,
          status: OrderStatus.PAID,
          deliveryMode: checkoutStore?.deliveryMode ?? undefined,
          paymentMethod: PaymentMethod.RAZORPAY,
          paymentStatus: PaymentStatus.PAID,
          orderVertical: OrderVertical.FOOD,
          subtotal: snapshot.totals.subtotal,
          deliveryFee: snapshot.totals.deliveryFee,
          packagingFee: snapshot.totals.packagingFee,
          taxAmount: snapshot.totals.tax,
          tipAmount: snapshot.tipAmount,
          discountAmount: snapshot.couponDiscount,
          totalAmount: snapshot.totalAmount,
          deliveryAddress: snapshot.dto.deliveryAddress as Prisma.InputJsonValue,
          deliveryLat: snapshot.dto.deliveryLat,
          deliveryLng: snapshot.dto.deliveryLng,
          scheduledDeliveryAt: snapshot.dto.scheduledDeliveryAt
            ? new Date(snapshot.dto.scheduledDeliveryAt)
            : null,
          specialInstructions: snapshot.dto.specialInstructions,
          restaurantNote: snapshot.dto.restaurantNote,
          kitchenStatus: FoodKitchenStatus.NEW,
          idempotencyKey: checkout.idempotencyKey,
          foodItems: {
            create: snapshot.items.map((item) => ({
              menuItemId: item.menuItemId,
              variantId: item.variantId,
              itemName: item.itemName,
              variantName: item.variantName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.lineTotal,
              specialInstructions: item.specialInstructions,
              addonsSnapshot: item.addons,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PAID,
              actorType: OrderActorType.BUYER,
              changedBy: opts.userId,
              note: 'Food order placed (online payment)',
            },
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: created.id,
          amount: Number(checkout.totalAmount),
          method: PaymentMethod.RAZORPAY,
          status: PaymentStatus.PAID,
          razorpayOrderId: opts.razorpayOrderId ?? undefined,
          razorpayPaymentId: opts.razorpayPaymentId,
          razorpaySignature: opts.razorpaySignature,
        },
      });

      await tx.foodCheckout.update({
        where: { id: checkout.id },
        data: { status: FOOD_CHECKOUT_COMPLETED, orderId: created.id },
      });

      await tx.foodCart.deleteMany({ where: { buyerProfileId: opts.buyerProfileId } });

      return created;
    });

    // Freeze order financials (commission, merchant net, tax). Ledger for online
    // payments is posted on payment confirmation, matching the marketplace path.
    void this.orderFinancials
      .freezeOnOrderCreate({
        orderId: order.id,
        storeId: snapshot.storeId,
        subtotal: snapshot.totals.subtotal,
        discountAmount: snapshot.couponDiscount,
        offerSubsidy: 0,
        deliveryFee: snapshot.totals.deliveryFee,
        taxAmount: snapshot.totals.tax,
        totalAmount: snapshot.totalAmount,
        tipAmount: snapshot.tipAmount,
        paymentMethod: PaymentMethod.RAZORPAY,
      })
      .then(() => this.orderFinancials.recordOnlinePaymentConfirmed(order.id))
      .catch((err) => this.logger.warn(`Food financial freeze failed: ${(err as Error).message}`));

    await this.audit.log({
      actorId: opts.userId,
      action: 'FOOD_ORDER_CREATED',
      resourceType: 'Order',
      resourceId: order.id,
    });

    void this.domainEvents.emit(DomainEventType.ORDER_CREATED, 'Order', order.id, {
      vertical: OrderVertical.FOOD,
      paymentMethod: PaymentMethod.RAZORPAY,
    });

    // Store-level affinity only — menu item IDs aren't Product rows, so they
    // can't feed the grocery product recommendation rail without corrupting it.
    void this.marketingEvents.track({
      userId: opts.userId,
      eventType: 'ORDER_PLACED',
      storeId: snapshot.storeId,
      orderId: order.id,
    });

    return { orderId: order.id, orderNumber: order.orderNumber };
  }

  async createFoodOrderFromCart(params: {
    buyerProfileId: string;
    userId: string;
    cart: NonNullable<Awaited<ReturnType<FoodCartService['getFoodCart']>>>;
    dto: InitiateFoodCheckoutDto;
    totalAmount: number;
    tipAmount: number;
    couponDiscount: number;
    idempotencyKey?: string;
  }) {
    const { buyerProfileId, userId, cart, dto, totalAmount, tipAmount, couponDiscount, idempotencyKey } =
      params;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerProfileId,
          storeId: cart.storeId,
          status: OrderStatus.MERCHANT_ACCEPTED,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING,
          orderVertical: OrderVertical.FOOD,
          subtotal: cart.totals.subtotal,
          deliveryFee: cart.totals.deliveryFee,
          packagingFee: cart.totals.packagingFee,
          taxAmount: cart.totals.tax,
          tipAmount,
          discountAmount: couponDiscount,
          totalAmount,
          deliveryAddress: dto.deliveryAddress as Prisma.InputJsonValue,
          deliveryLat: dto.deliveryLat,
          deliveryLng: dto.deliveryLng,
          scheduledDeliveryAt: dto.scheduledDeliveryAt ? new Date(dto.scheduledDeliveryAt) : null,
          specialInstructions: dto.specialInstructions,
          restaurantNote: dto.restaurantNote,
          kitchenStatus: FoodKitchenStatus.NEW,
          idempotencyKey,
          foodItems: {
            create: cart.items.map((item) => ({
              menuItemId: item.menuItemId,
              variantId: item.variantId,
              itemName: item.menuItem.name,
              variantName: item.variantName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.lineTotal,
              specialInstructions: item.specialInstructions,
              addonsSnapshot: item.addons,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.MERCHANT_ACCEPTED,
              actorType: OrderActorType.BUYER,
              changedBy: userId,
              note: 'Food COD order placed',
            },
          },
        },
        include: { foodItems: true },
      });

      await tx.foodCart.deleteMany({ where: { buyerProfileId } });
      return created;
    });

    // Freeze order financials (commission, merchant net earnings, tax record, and
    // COD ledger posting) — same treatment as the marketplace checkout path.
    void this.orderFinancials
      .freezeOnOrderCreate({
        orderId: order.id,
        storeId: cart.storeId,
        subtotal: cart.totals.subtotal,
        discountAmount: couponDiscount,
        offerSubsidy: 0,
        deliveryFee: cart.totals.deliveryFee,
        taxAmount: cart.totals.tax,
        totalAmount,
        tipAmount,
        paymentMethod: PaymentMethod.COD,
      })
      .catch((err) => this.logger.warn(`Food financial freeze failed: ${(err as Error).message}`));

    await this.audit.log({
      actorId: userId,
      action: 'FOOD_ORDER_CREATED',
      resourceType: 'Order',
      resourceId: order.id,
    });

    void this.domainEvents.emit(DomainEventType.ORDER_CREATED, 'Order', order.id, {
      vertical: OrderVertical.FOOD,
      paymentMethod: PaymentMethod.COD,
    });

    void this.marketingEvents.track({
      userId,
      eventType: 'ORDER_PLACED',
      storeId: cart.storeId,
      orderId: order.id,
    });

    return { orderId: order.id, orderNumber: order.orderNumber, status: order.status };
  }

  async getCheckoutStatus(checkoutId: string, userId: string) {
    const buyerProfile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!buyerProfile) throw new NotFoundException('Buyer profile not found');

    const checkout = await this.prisma.foodCheckout.findFirst({
      where: { id: checkoutId, buyerProfileId: buyerProfile.id },
    });
    if (!checkout) throw new NotFoundException('Checkout not found');
    return checkout;
  }

  private effectiveMinOrder(
    cart: NonNullable<Awaited<ReturnType<FoodCartService['getFoodCart']>>>,
  ): number {
    return cart.store.minOrderAmount;
  }

  private async validateCartAvailability(menuItemIds: string[]) {
    const unavailable = await this.prisma.restaurantMenuItem.count({
      where: {
        id: { in: menuItemIds },
        OR: [
          { isActive: false },
          { availability: { not: MenuItemAvailability.AVAILABLE } },
        ],
      },
    });
    if (unavailable > 0) {
      throw new BadRequestException('One or more menu items are no longer available');
    }
  }

  private async assertStoreAcceptingOrders(storeId: string): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, status: 'APPROVED', isActive: true, deletedAt: null },
      select: { merchantProfile: { select: { isBlacklisted: true } } },
    });
    if (!store || store.merchantProfile?.isBlacklisted) {
      throw new BadRequestException('Store is no longer accepting orders');
    }
  }
}
