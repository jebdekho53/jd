import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CartView } from '../cart/cart.service';

@Injectable()
export class PromotionCartService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCoupon(
    buyerProfileId: string,
    code: string,
    cart: CartView,
  ): Promise<{ valid: boolean; message?: string; coupon?: Coupon }> {
    try {
      const coupon = await this.resolveCoupon(code, buyerProfileId, cart);
      return { valid: true, coupon };
    } catch (err) {
      return {
        valid: false,
        message: err instanceof Error ? err.message : 'Invalid coupon',
      };
    }
  }

  async applyCoupon(userId: string, code: string): Promise<void> {
    const buyerProfileId = await this.requireBuyerProfileId(userId);
    const cart = await this.prisma.cart.findFirst({
      where: { buyerProfileId },
      include: {
        items: {
          include: {
            variant: { select: { price: true } },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    const subtotal = cart.items.reduce(
      (s, i) => s + Number(i.variant.price) * i.quantity,
      0,
    );
    const stubCart: CartView = {
      id: cart.id,
      storeId: cart.storeId,
      store: { id: cart.storeId, name: '', slug: '', minOrderAmount: 0 },
      items: [],
      totals: {
        subtotal,
        discount: 0,
        catalogSavings: 0,
        offerDiscount: 0,
        couponDiscount: 0,
        deliveryDiscount: 0,
        totalSavings: 0,
        tax: 0,
        deliveryFee: 0,
        grandTotal: subtotal,
      },
      itemCount: cart.items.length,
    };

    const coupon = await this.resolveCoupon(code, buyerProfileId, stubCart);
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { appliedCouponId: coupon.id },
    });
  }

  async removeCoupon(userId: string): Promise<void> {
    const buyerProfileId = await this.requireBuyerProfileId(userId);
    const cart = await this.prisma.cart.findFirst({ where: { buyerProfileId } });
    if (!cart) return;
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { appliedCouponId: null },
    });
  }

  private async resolveCoupon(
    code: string,
    buyerProfileId: string,
    cart: CartView,
  ): Promise<Coupon> {
    const normalized = code.trim().toUpperCase();
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: { equals: normalized, mode: 'insensitive' } },
    });

    if (!coupon) throw new BadRequestException('Coupon not found');
    if (!coupon.isActive || coupon.suspendedAt) {
      throw new BadRequestException('This coupon is no longer active');
    }

    const now = new Date();
    if (now < coupon.startsAt) throw new BadRequestException('Coupon is not active yet');
    if (now > coupon.expiresAt) throw new BadRequestException('Coupon has expired');

    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (Number(coupon.minOrderAmount) > cart.totals.subtotal) {
      throw new BadRequestException(
        `Minimum order value ₹${Number(coupon.minOrderAmount)} required`,
      );
    }

    if (coupon.storeId && coupon.storeId !== cart.storeId) {
      throw new BadRequestException('Coupon is not valid for this store');
    }

    const userUsage = await this.prisma.couponUsage.count({
      where: { couponId: coupon.id, buyerProfileId },
    });
    if (userUsage >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon');
    }

    if (coupon.firstOrderOnly) {
      const priorOrders = await this.prisma.order.count({
        where: {
          buyerProfileId,
          status: { in: ['DELIVERED', 'COMPLETED'] },
        },
      });
      if (priorOrders > 0) {
        throw new BadRequestException('This coupon is for first orders only');
      }
    }

    return coupon;
  }

  private async requireBuyerProfileId(userId: string): Promise<string> {
    const bp = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!bp) throw new NotFoundException('Buyer profile not found');
    return bp.id;
  }
}
