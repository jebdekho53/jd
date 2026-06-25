import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { AddCartItemDto, UpdateCartDto } from './dto/procurement.dto';

@Injectable()
export class ProcurementCartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantDashboard: MerchantDashboardService,
  ) {}

  async getCart(userId: string, storeId?: string) {
    const profile = await this.resolveMerchant(userId);
    let cart = await this.prisma.procurementCart.findFirst({
      where: { merchantProfileId: profile.id, ...(storeId ? { storeId } : {}) },
      include: {
        items: { include: { vendorProduct: { include: { vendor: true, inventory: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (!cart) {
      cart = await this.prisma.procurementCart.create({
        data: { merchantProfileId: profile.id, storeId },
        include: {
          items: { include: { vendorProduct: { include: { vendor: true, inventory: true } } } },
        },
      });
    }
    return cart;
  }

  async updateCart(userId: string, dto: UpdateCartDto) {
    const profile = await this.resolveMerchant(userId);
    if (dto.storeId) {
      const ctx = await this.merchantDashboard.resolveStoreContext(userId, dto.storeId);
      if (!ctx.storeIds.includes(dto.storeId)) throw new ForbiddenException('Invalid store');
    }

    let cart = await this.prisma.procurementCart.findFirst({
      where: { merchantProfileId: profile.id, storeId: dto.storeId ?? undefined },
    });
    if (!cart) {
      cart = await this.prisma.procurementCart.create({
        data: { merchantProfileId: profile.id, storeId: dto.storeId, vendorId: dto.vendorId },
      });
    }

    await this.prisma.procurementCartItem.deleteMany({ where: { cartId: cart.id } });

    for (const item of dto.items) {
      const product = await this.prisma.vendorProduct.findUnique({
        where: { id: item.vendorProductId },
        include: { priceTiers: { orderBy: { minQty: 'desc' } } },
      });
      if (!product || !product.isActive) throw new BadRequestException('Product unavailable');
      if (item.quantity < product.moq) {
        throw new BadRequestException(`MOQ is ${product.moq} for ${product.name}`);
      }

      const tier = product.priceTiers.find((t) => item.quantity >= t.minQty);
      const unitPrice = tier ? Number(tier.unitPrice) : Number(product.basePrice);

      await this.prisma.procurementCartItem.create({
        data: { cartId: cart.id, vendorProductId: item.vendorProductId, quantity: item.quantity, unitPrice },
      });
    }

    return this.getCart(userId, dto.storeId);
  }

  async addItem(userId: string, dto: AddCartItemDto, storeId?: string) {
    const cart = await this.getCart(userId, storeId);
    const existing = cart.items.find((i) => i.vendorProductId === dto.vendorProductId);
    const items = existing
      ? cart.items.map((i) =>
          i.vendorProductId === dto.vendorProductId
            ? { vendorProductId: i.vendorProductId, quantity: i.quantity + dto.quantity }
            : { vendorProductId: i.vendorProductId, quantity: i.quantity },
        )
      : [
          ...cart.items.map((i) => ({ vendorProductId: i.vendorProductId, quantity: i.quantity })),
          { vendorProductId: dto.vendorProductId, quantity: dto.quantity },
        ];
    return this.updateCart(userId, { items, storeId });
  }

  private async resolveMerchant(userId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Merchant profile required');
    return profile;
  }
}
