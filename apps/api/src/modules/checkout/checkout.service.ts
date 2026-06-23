import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CheckoutStatus,
  DomainEventType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  StoreStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { CartService } from '../cart/cart.service';
import { ReservationService } from './reservation.service';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';

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
        cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
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
    );

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

    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!buyerProfile) throw new BadRequestException('Buyer profile not found');

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
        cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
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
    const order = await this.createOrderFromCheckout(checkout.id, cart, buyerProfile.id, address, dto.buyerNote, PaymentMethod.COD);

    // Consume reservations
    await this.reservation.consumeReservations(checkout.id);

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

    this.logger.log({ userId, orderId: order.id, orderNumber: order.orderNumber }, 'COD order created');

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

    await this.reservation.consumeReservations(checkoutId);

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

    return order;
  }

  // ── Private: create Order + OrderItems from checkout data ─────────────────

  private async createOrderFromCheckout(
    checkoutId: string,
    cart: any,
    buyerProfileId: string,
    address: any,
    buyerNote?: string,
    paymentMethod: PaymentMethod = PaymentMethod.RAZORPAY,
  ) {
    const totals = cart.totals ?? { subtotal: 0, discount: 0, deliveryFee: 0, tax: 0, grandTotal: 0 };
    const items: any[] = cart.items ?? [];

    return this.prisma.$transaction(async (tx) => {
      let orderNumber: string;
      let attempts = 0;

      // Ensure unique order number (extremely low collision probability)
      do {
        orderNumber = generateOrderNumber();
        attempts++;
        if (attempts > 5) throw new Error('Could not generate unique order number');
      } while (
        await tx.order.findUnique({ where: { orderNumber } })
      );

      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerProfileId,
          storeId: cart.storeId,
          status: paymentMethod === PaymentMethod.COD
            ? OrderStatus.MERCHANT_ACCEPTED
            : OrderStatus.PAYMENT_PENDING,
          paymentMethod,
          paymentStatus: paymentMethod === PaymentMethod.COD
            ? PaymentStatus.PENDING   // COD: payment pending on delivery
            : PaymentStatus.PENDING,
          subtotal: totals.subtotal,
          discountAmount: totals.discount ?? 0,
          deliveryFee: totals.deliveryFee ?? 0,
          taxAmount: totals.tax ?? 0,
          totalAmount: totals.grandTotal,
          deliveryAddress: { line1: address.line1, line2: address.line2, city: address.city, pincode: address.pincode },
          deliveryLat: address.lat ?? 0,
          deliveryLng: address.lng ?? 0,
          buyerNote,
          idempotencyKey: checkoutId, // checkoutId → idempotency for order creation
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

      // Create initial status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          note: paymentMethod === PaymentMethod.COD
            ? 'COD order created'
            : 'Order created, awaiting payment',
        },
      });

      return order;
    });
  }

  // ── Private: validate cart before checkout ─────────────────────────────────

  private async validateCartForCheckout(cart: { storeId: string; items: any[] }): Promise<void> {
    // Re-validate store is still active
    const store = await this.prisma.store.findFirst({
      where: {
        id: cart.storeId,
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
      },
    });
    if (!store) throw new BadRequestException('Store is no longer accepting orders');

    // Re-validate each product + available inventory
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
        ? variant.inventory.quantity - variant.inventory.reserved
        : 0;

      if (available < item.quantity) {
        throw new BadRequestException(
          `Only ${available} unit(s) available for "${item.product?.name ?? item.variantId}"`,
        );
      }
    }
  }
}
