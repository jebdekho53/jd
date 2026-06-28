import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MenuItemAvailability, Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AddFoodCartItemDto, UpdateFoodCartItemDto } from './dto/add-food-cart-item.dto';

@Injectable()
export class FoodCartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBuyerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Buyer profile not found');
    return profile.id;
  }

  async getFoodCart(userId: string) {
    const buyerProfileId = await this.getBuyerProfileId(userId);
    const cart = await this.prisma.foodCart.findFirst({
      where: { buyerProfileId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            minOrderAmount: true,
            deliveryFee: true,
            restaurantProfile: { select: { packagingFee: true, minOrderAmount: true } },
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrls: true,
                dietType: true,
                availability: true,
              },
            },
            variant: true,
            addons: { include: { addon: true } },
          },
        },
        appliedCoupon: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!cart) return null;
    return this.toCartView(cart);
  }

  async addItem(userId: string, dto: AddFoodCartItemDto) {
    const buyerProfileId = await this.getBuyerProfileId(userId);

    const menuItem = await this.prisma.restaurantMenuItem.findFirst({
      where: {
        id: dto.menuItemId,
        isActive: true,
        availability: MenuItemAvailability.AVAILABLE,
      },
      include: {
        variants: true,
        addonGroups: {
          include: {
            group: {
              include: { addons: { where: { isActive: true } } },
            },
          },
        },
        store: { select: { id: true, status: true, isActive: true } },
      },
    });
    if (!menuItem) throw new NotFoundException('Menu item not found');
    if (menuItem.store.status !== StoreStatus.APPROVED || !menuItem.store.isActive) {
      throw new BadRequestException('Restaurant is not available');
    }

    const existingCart = await this.prisma.foodCart.findFirst({ where: { buyerProfileId } });
    if (existingCart && existingCart.storeId !== menuItem.storeId) {
      throw new ConflictException({
        message: 'Food cart already has items from another restaurant',
        code: 'FOOD_CART_STORE_CONFLICT',
        currentStoreId: existingCart.storeId,
      });
    }

    const variant = dto.variantId
      ? menuItem.variants.find((v) => v.id === dto.variantId)
      : menuItem.variants.find((v) => v.isDefault) ?? menuItem.variants[0];
    if (dto.variantId && !variant) throw new BadRequestException('Invalid variant');

    const unitPrice = variant ? Number(variant.price) : Number(menuItem.basePrice);
    const addonTotal = await this.validateAndPriceAddons(menuItem, dto.addonIds ?? []);

    const cart = existingCart ?? (await this.prisma.foodCart.create({
      data: { buyerProfileId, storeId: menuItem.storeId },
    }));

    const cartItem = await this.prisma.foodCartItem.create({
      data: {
        foodCartId: cart.id,
        menuItemId: menuItem.id,
        variantId: variant?.id,
        comboId: dto.comboId,
        quantity: dto.quantity ?? 1,
        unitPrice: unitPrice + addonTotal,
        specialInstructions: dto.specialInstructions,
        addons: dto.addonIds?.length
          ? {
              create: await this.buildAddonRows(menuItem, dto.addonIds),
            }
          : undefined,
      },
    });

    void cartItem;
    return this.getFoodCart(userId);
  }

  private async validateAndPriceAddons(
    menuItem: {
      addonGroups: {
        group: {
          id: string;
          isRequired: boolean;
          minSelections: number;
          maxSelections: number;
          addons: { id: string; price: Prisma.Decimal }[];
        };
      }[];
    },
    addonIds: string[],
  ): Promise<number> {
    const allowed = new Map<string, { price: number; groupId: string }>();
    for (const link of menuItem.addonGroups) {
      for (const addon of link.group.addons) {
        allowed.set(addon.id, { price: Number(addon.price), groupId: link.group.id });
      }
    }

    const byGroup = new Map<string, string[]>();
    let total = 0;
    for (const addonId of addonIds) {
      const meta = allowed.get(addonId);
      if (!meta) throw new BadRequestException(`Invalid addon: ${addonId}`);
      total += meta.price;
      const list = byGroup.get(meta.groupId) ?? [];
      list.push(addonId);
      byGroup.set(meta.groupId, list);
    }

    for (const link of menuItem.addonGroups) {
      const selected = byGroup.get(link.group.id) ?? [];
      if (link.group.isRequired && selected.length === 0) {
        throw new BadRequestException(`Required addon group missing: ${link.group.id}`);
      }
      if (selected.length < link.group.minSelections) {
        throw new BadRequestException(`Minimum selections not met for addon group`);
      }
      if (selected.length > link.group.maxSelections) {
        throw new BadRequestException(`Too many addons selected for group`);
      }
    }

    return total;
  }

  private async buildAddonRows(
    menuItem: {
      addonGroups: { group: { id: string; addons: { id: string; price: Prisma.Decimal }[] } }[];
    },
    addonIds: string[],
  ) {
    const rows: { addonId: string; addonGroupId: string; price: number }[] = [];
    const addonMap = new Map<string, { groupId: string; price: number }>();
    for (const link of menuItem.addonGroups) {
      for (const a of link.group.addons) {
        addonMap.set(a.id, { groupId: link.group.id, price: Number(a.price) });
      }
    }
    for (const id of addonIds) {
      const meta = addonMap.get(id);
      if (meta) rows.push({ addonId: id, addonGroupId: meta.groupId, price: meta.price });
    }
    return rows;
  }

  async updateItem(userId: string, cartItemId: string, dto: UpdateFoodCartItemDto) {
    const buyerProfileId = await this.getBuyerProfileId(userId);
    const item = await this.prisma.foodCartItem.findFirst({
      where: { id: cartItemId, foodCart: { buyerProfileId } },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity === 0) {
      await this.prisma.foodCartItem.delete({ where: { id: cartItemId } });
      await this.cleanupEmptyCart(buyerProfileId);
      return this.getFoodCart(userId);
    }

    await this.prisma.foodCartItem.update({
      where: { id: cartItemId },
      data: { quantity: dto.quantity },
    });
    return this.getFoodCart(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const buyerProfileId = await this.getBuyerProfileId(userId);
    const item = await this.prisma.foodCartItem.findFirst({
      where: { id: cartItemId, foodCart: { buyerProfileId } },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.foodCartItem.delete({ where: { id: cartItemId } });
    await this.cleanupEmptyCart(buyerProfileId);
    return this.getFoodCart(userId);
  }

  async clearCart(userId: string) {
    const buyerProfileId = await this.getBuyerProfileId(userId);
    await this.prisma.foodCart.deleteMany({ where: { buyerProfileId } });
    return null;
  }

  private async cleanupEmptyCart(buyerProfileId: string) {
    const cart = await this.prisma.foodCart.findFirst({
      where: { buyerProfileId },
      include: { _count: { select: { items: true } } },
    });
    if (cart && cart._count.items === 0) {
      await this.prisma.foodCart.delete({ where: { id: cart.id } });
    }
  }

  private toCartView(cart: {
    id: string;
    storeId: string;
    store: {
      id: string;
      name: string;
      slug: string;
      minOrderAmount: Prisma.Decimal;
      deliveryFee: Prisma.Decimal;
      restaurantProfile: { packagingFee: Prisma.Decimal; minOrderAmount: Prisma.Decimal | null } | null;
    };
    items: {
      id: string;
      menuItemId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: Prisma.Decimal;
      specialInstructions: string | null;
      menuItem: { id: string; name: string; imageUrls: unknown; dietType: string };
      variant: { name: string } | null;
      addons: { addon: { name: string }; price: Prisma.Decimal }[];
    }[];
  }) {
    const packagingFee = Number(cart.store.restaurantProfile?.packagingFee ?? 0);
    const deliveryFee = Number(cart.store.deliveryFee);
    const minOrderAmount = Number(
      cart.store.restaurantProfile?.minOrderAmount ?? cart.store.minOrderAmount,
    );
    const subtotal = cart.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const grandTotal = subtotal + packagingFee + deliveryFee + tax;

    return {
      id: cart.id,
      storeId: cart.storeId,
      store: {
        ...cart.store,
        minOrderAmount,
        deliveryFee,
        packagingFee,
      },
      items: cart.items.map((i) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.unitPrice) * i.quantity,
        specialInstructions: i.specialInstructions,
        menuItem: {
          ...i.menuItem,
          imageUrls: Array.isArray(i.menuItem.imageUrls) ? i.menuItem.imageUrls : [],
        },
        variantName: i.variant?.name,
        addons: i.addons.map((a) => ({ name: a.addon.name, price: Number(a.price) })),
      })),
      totals: {
        subtotal,
        packagingFee,
        deliveryFee,
        tax,
        grandTotal,
      },
      itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
    };
  }
}
