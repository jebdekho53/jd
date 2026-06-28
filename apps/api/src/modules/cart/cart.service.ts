import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { DomainEventType, Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { CartCacheService } from './cart-cache.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { StorePromotionService } from '../promotion/store-promotion.service';
import { MembershipBenefitService } from '../membership/membership-benefit.service';
import type { PromoBreakdown } from '../promotion/promotion-pricing.service';
import {
  buildReturnPolicySummary,
  type ReturnPolicySummary,
} from '../../common/utils/product-return-policy.util';

// ── Response types ─────────────────────────────────────────────────────────────

export interface CartItemView {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  mrp: number | null;
  lineTotal: number;
  savings: number;
  product: { name: string; slug: string; imageUrls: string[]; isVeg: boolean | null };
  variant: { name: string; sku: string; weightGrams: number | null };
  availableQty: number;
  returnPolicy?: ReturnPolicySummary;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  catalogSavings: number;
  offerDiscount: number;
  couponDiscount: number;
  deliveryDiscount: number;
  totalSavings: number;
  tax: number;
  deliveryFee: number;
  grandTotal: number;
  promo?: PromoBreakdown;
}

export interface CartView {
  id: string;
  storeId: string;
  store: { id: string; name: string; slug: string; minOrderAmount: number };
  items: CartItemView[];
  totals: CartTotals;
  itemCount: number;
  appliedCouponCode?: string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly cartCache: CartCacheService,
    @Inject(forwardRef(() => StorePromotionService))
    private readonly promotions: StorePromotionService,
    private readonly membershipBenefits: MembershipBenefitService,
  ) {}

  async getBuyerProfileId(userId: string): Promise<string> {
    const { id } = await this.getOrCreateBuyerProfile(userId);
    return id;
  }

  async invalidateCache(userId: string): Promise<void> {
    const { id } = await this.getOrCreateBuyerProfile(userId);
    await this.cartCache.invalidate(id);
  }

  // ── Get or create buyer profile ────────────────────────────────────────────

  private async getOrCreateBuyerProfile(userId: string): Promise<{ id: string }> {
    const existing = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) return existing;

    // Name is required by schema — derive from user phone/email at profile creation.
    // The auth user's display name is not available here; use a placeholder that
    // the buyer can update via their profile endpoint (Phase 6+).
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, email: true },
    });
    const name = user?.email?.split('@')[0] ?? user?.phone ?? 'Buyer';

    return this.prisma.buyerProfile.create({
      data: { userId, name },
      select: { id: true },
    });
  }

  // ── Get cart (with cache) ──────────────────────────────────────────────────

  async getCart(userId: string): Promise<CartView | null> {
    const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);

    const cached = await this.cartCache.get<CartView>(buyerProfileId);
    if (cached) return cached;

    const cart = await this.loadCartFromDb(buyerProfileId);
    if (cart) await this.cartCache.set(buyerProfileId, cart);
    return cart;
  }

  // ── Add item ───────────────────────────────────────────────────────────────

  async addItem(
    userId: string,
    dto: AddCartItemDto,
    ipAddress?: string,
  ): Promise<CartView> {
    const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);

    // Validate product + variant belong to the same store + are visible
    const { variant, product, store } = await this.resolveVariant(
      dto.productId,
      dto.variantId,
    );

    // Check available stock
    const availableQty = this.availableQty(variant.inventory);
    if (availableQty <= 0) {
      throw new ConflictException({
        code: 'INVENTORY_CHANGED',
        message: `"${product.name}" is out of stock`,
      });
    }

    // Load or create cart
    let cart = await this.prisma.cart.findFirst({
      where: { buyerProfileId },
    });

    // One-store-per-cart enforcement
    if (cart && cart.storeId !== store.id) {
      throw new ConflictException(
        `Your cart already contains items from "${await this.getStoreName(cart.storeId)}". ` +
          `Clear your cart before adding items from a different store.`,
      );
    }

    const isNewCart = !cart;

    cart = await this.prisma.$transaction(async (tx) => {
      // Upsert the cart
      const c = await tx.cart.upsert({
        where: { buyerProfileId_storeId: { buyerProfileId, storeId: store.id } },
        update: {},
        create: { buyerProfileId, storeId: store.id },
      });

      // Check if item already in cart
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: c.id, variantId: dto.variantId } },
      });

      const newQty = (existing?.quantity ?? 0) + dto.quantity;

      if (newQty > availableQty) {
        throw new ConflictException({
          code: 'INVENTORY_CHANGED',
          message:
            `Only ${availableQty} unit(s) of "${product.name}" are available. ` +
            `You already have ${existing?.quantity ?? 0} in your cart.`,
        });
      }

      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: newQty },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: c.id,
            productId: dto.productId,
            variantId: dto.variantId,
            quantity: dto.quantity,
          },
        });
      }

      return c;
    });

    await this.cartCache.invalidate(buyerProfileId);

    const cartView = await this.loadCartFromDb(buyerProfileId);
    if (!cartView) throw new NotFoundException('Cart not found after creation');
    await this.cartCache.set(buyerProfileId, cartView);

    // Audit + domain events (fire-and-forget)
    void Promise.all([
      this.audit.log({
        actorId: userId,
        action: isNewCart ? 'CART_CREATED' : 'CART_ITEM_ADDED',
        resourceType: 'cart',
        resourceId: cart.id,
        ipAddress,
        metadata: {
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
          storeId: store.id,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        isNewCart ? DomainEventType.CART_CREATED : DomainEventType.CART_ITEM_ADDED,
        'cart',
        cart.id,
        { buyerProfileId, storeId: store.id, productId: dto.productId },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.debug({ userId, cartId: cart.id }, isNewCart ? 'Cart created' : 'Item added');
    return cartView;
  }

  // ── Update item quantity ────────────────────────────────────────────────────

  async updateItem(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
    ipAddress?: string,
  ): Promise<CartView | null> {
    const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);
    const cartItem = await this.assertCartItemOwnership(cartItemId, buyerProfileId);

    // quantity=0 means remove
    if (dto.quantity === 0) {
      return this.removeItemById(userId, buyerProfileId, cartItem, ipAddress);
    }

    // Validate stock
    const { variant, product } = await this.resolveVariant(
      cartItem.productId,
      cartItem.variantId,
    );
    const available = this.availableQty(variant.inventory);
    if (dto.quantity > available) {
      throw new ConflictException({
        code: 'INVENTORY_CHANGED',
        message: `Only ${available} unit(s) of "${product.name}" available`,
      });
    }

    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: dto.quantity },
    });

    await this.cartCache.invalidate(buyerProfileId);

    const cartView = await this.loadCartFromDb(buyerProfileId);
    if (!cartView) throw new NotFoundException('Cart not found');
    await this.cartCache.set(buyerProfileId, cartView);

    void Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'CART_UPDATED',
        resourceType: 'cart_item',
        resourceId: cartItemId,
        ipAddress,
        metadata: {
          cartId: cartItem.cartId,
          previousQty: cartItem.quantity,
          newQty: dto.quantity,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.CART_UPDATED,
        'cart',
        cartItem.cartId,
        { buyerProfileId, cartItemId, quantity: dto.quantity },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    return cartView;
  }

  // ── Remove item ────────────────────────────────────────────────────────────

  async removeItem(
    userId: string,
    cartItemId: string,
    ipAddress?: string,
  ): Promise<CartView | null> {
    const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);
    const cartItem = await this.assertCartItemOwnership(cartItemId, buyerProfileId);
    return this.removeItemById(userId, buyerProfileId, cartItem, ipAddress);
  }

  // ── Clear cart ─────────────────────────────────────────────────────────────

  async clearCart(userId: string, ipAddress?: string): Promise<void> {
    const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);

    const cart = await this.prisma.cart.findFirst({ where: { buyerProfileId } });
    if (!cart) return;

    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      this.prisma.cart.delete({ where: { id: cart.id } }),
    ]);

    await this.cartCache.invalidate(buyerProfileId);

    void Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'CART_CLEARED',
        resourceType: 'cart',
        resourceId: cart.id,
        ipAddress,
        metadata: { storeId: cart.storeId } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.CART_CLEARED,
        'cart',
        cart.id,
        { buyerProfileId, storeId: cart.storeId },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.debug({ userId, cartId: cart.id }, 'Cart cleared');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async loadCartFromDb(buyerProfileId: string): Promise<CartView | null> {
    const cart = await this.prisma.cart.findFirst({
      where: { buyerProfileId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            deliveryFee: true,
            minOrderAmount: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                imageUrls: true,
                isVeg: true,
                categoryId: true,
                isReturnable: true,
                isRefundable: true,
                isReplaceable: true,
                returnWindowHours: true,
                approvalMode: true,
                proofRequired: true,
                autoApproveBelowAmount: true,
                returnReasons: true,
                restockingFee: true,
                refundMethod: true,
                returnPolicyText: true,
                replacementPolicyText: true,
                preparedFoodPolicy: true,
                allowCustomerChangedMind: true,
              },
            },
            variant: {
              select: {
                name: true,
                sku: true,
                price: true,
                mrp: true,
                weightGrams: true,
                inventory: { select: { availableQty: true, reservedQty: true, status: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) return null;

    const items: CartItemView[] = cart.items.map((item) => {
      const unitPrice = Number(item.variant.price);
      const mrp = item.variant.mrp ? Number(item.variant.mrp) : null;
      const lineTotal = unitPrice * item.quantity;
      const savings = mrp ? Math.max(0, (mrp - unitPrice) * item.quantity) : 0;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        mrp,
        lineTotal,
        savings,
        product: item.product,
        variant: {
          name: item.variant.name,
          sku: item.variant.sku,
          weightGrams: item.variant.weightGrams,
        },
        availableQty: item.variant.inventory
          ? Math.max(0, item.variant.inventory.availableQty)
          : 0,
        returnPolicy: buildReturnPolicySummary({
          isReturnable: item.product.isReturnable,
          isRefundable: item.product.isRefundable,
          isReplaceable: item.product.isReplaceable,
          returnWindowHours: item.product.returnWindowHours,
          approvalMode: item.product.approvalMode,
          proofRequired: item.product.proofRequired,
          autoApproveBelowAmount: item.product.autoApproveBelowAmount
            ? Number(item.product.autoApproveBelowAmount)
            : null,
          returnReasons: item.product.returnReasons,
          restockingFee: Number(item.product.restockingFee),
          refundMethod: item.product.refundMethod,
          returnPolicyText: item.product.returnPolicyText,
          replacementPolicyText: item.product.replacementPolicyText,
          preparedFoodPolicy: item.product.preparedFoodPolicy,
          allowCustomerChangedMind: item.product.allowCustomerChangedMind,
        }),
      };
    });

    const catalogSavings = items.reduce((sum, i) => sum + i.savings, 0);
    const baseDeliveryFee = Number(cart.store.deliveryFee);

    const promoItems = cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      categoryId: item.product.categoryId,
      quantity: item.quantity,
      unitPrice: Number(item.variant.price),
      lineTotal: Number(item.variant.price) * item.quantity,
    }));

    const enriched = await this.promotions.enrichCartPromotions(
      cart.id,
      cart.storeId,
      buyerProfileId,
      baseDeliveryFee,
      catalogSavings,
      promoItems,
      cart.appliedCouponId,
      cart.appliedPromotionId,
      cart.appliedOfferId,
    );

    let appliedCouponCode: string | null = null;
    if (enriched.promo.appliedCoupon) {
      appliedCouponCode = enriched.promo.appliedCoupon.code;
    }

    let deliveryFee = enriched.deliveryFee;
    let grandTotal = enriched.grandTotal;
    const buyer = await this.prisma.buyerProfile.findUnique({
      where: { id: buyerProfileId },
      select: { userId: true },
    });
    if (buyer && (await this.membershipBenefits.hasFreeDelivery(buyer.userId))) {
      grandTotal = Math.max(0, grandTotal - deliveryFee);
      deliveryFee = 0;
    }

    return {
      id: cart.id,
      storeId: cart.storeId,
      store: {
        id: cart.store.id,
        name: cart.store.name,
        slug: cart.store.slug,
        minOrderAmount: Number(cart.store.minOrderAmount),
      },
      items,
      totals: {
        subtotal: enriched.subtotal,
        discount: catalogSavings,
        catalogSavings: enriched.catalogSavings,
        offerDiscount: enriched.offerDiscount,
        couponDiscount: enriched.couponDiscount,
        deliveryDiscount: enriched.deliveryDiscount,
        totalSavings: enriched.totalSavings,
        tax: enriched.tax,
        deliveryFee,
        grandTotal,
        promo: enriched.promo,
      },
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      appliedCouponCode,
    };
  }

  private async resolveVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
        isActive: true,
        product: { isActive: true, deletedAt: null },
      },
      include: {
        inventory: { select: { availableQty: true, reservedQty: true, status: true } },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrls: true,
            isVeg: true,
            storeId: true,
          },
        },
      },
    });

    if (!variant) {
      throw new BadRequestException(
        `Product/variant not found or not available: productId=${productId}, variantId=${variantId}`,
      );
    }

    const store = await this.prisma.store.findFirst({
      where: {
        id: variant.product.storeId,
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true, slug: true, deliveryFee: true },
    });

    if (!store) {
      throw new BadRequestException('Store is not currently accepting orders');
    }

    return { variant, product: variant.product, store };
  }

  private availableQty(
    inv: { availableQty: number; status?: string } | null,
  ): number {
    if (!inv || inv.status === 'DISABLED') return 0;
    return Math.max(0, inv.availableQty);
  }

  private async assertCartItemOwnership(
    cartItemId: string,
    buyerProfileId: string,
  ): Promise<{ id: string; cartId: string; productId: string; variantId: string; quantity: number }> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      select: { id: true, cartId: true, productId: true, variantId: true, quantity: true, cart: { select: { buyerProfileId: true } } },
    });

    if (!item) throw new NotFoundException(`Cart item not found: ${cartItemId}`);
    if (item.cart.buyerProfileId !== buyerProfileId) {
      throw new ForbiddenException('Cart item does not belong to you');
    }
    return item;
  }

  private async removeItemById(
    userId: string,
    buyerProfileId: string,
    cartItem: { id: string; cartId: string },
    ipAddress?: string,
  ): Promise<CartView | null> {
    await this.prisma.cartItem.delete({ where: { id: cartItem.id } });

    // If cart is now empty, delete it too
    const remaining = await this.prisma.cartItem.count({
      where: { cartId: cartItem.cartId },
    });
    if (remaining === 0) {
      await this.prisma.cart.delete({ where: { id: cartItem.cartId } });
    }

    await this.cartCache.invalidate(buyerProfileId);

    const cartView = await this.loadCartFromDb(buyerProfileId);
    if (cartView) await this.cartCache.set(buyerProfileId, cartView);

    void Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'CART_ITEM_REMOVED',
        resourceType: 'cart_item',
        resourceId: cartItem.id,
        ipAddress,
        metadata: { cartId: cartItem.cartId } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.CART_ITEM_REMOVED,
        'cart',
        cartItem.cartId,
        { buyerProfileId, cartItemId: cartItem.id },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    return cartView;
  }

  private async getStoreName(storeId: string): Promise<string> {
    const s = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { name: true },
    });
    return s?.name ?? storeId;
  }
}
