"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodCartService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let FoodCartService = class FoodCartService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBuyerProfileId(userId) {
        const profile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Buyer profile not found');
        return profile.id;
    }
    async getFoodCart(userId) {
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
        if (!cart)
            return null;
        return this.toCartView(cart);
    }
    async addItem(userId, dto) {
        const buyerProfileId = await this.getBuyerProfileId(userId);
        const menuItem = await this.prisma.restaurantMenuItem.findFirst({
            where: {
                id: dto.menuItemId,
                isActive: true,
                availability: client_1.MenuItemAvailability.AVAILABLE,
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
        if (!menuItem)
            throw new common_1.NotFoundException('Menu item not found');
        if (menuItem.store.status !== client_1.StoreStatus.APPROVED || !menuItem.store.isActive) {
            throw new common_1.BadRequestException('Restaurant is not available');
        }
        const existingCart = await this.prisma.foodCart.findFirst({ where: { buyerProfileId } });
        if (existingCart && existingCart.storeId !== menuItem.storeId) {
            throw new common_1.ConflictException({
                message: 'Food cart already has items from another restaurant',
                code: 'FOOD_CART_STORE_CONFLICT',
                currentStoreId: existingCart.storeId,
            });
        }
        const variant = dto.variantId
            ? menuItem.variants.find((v) => v.id === dto.variantId)
            : menuItem.variants.find((v) => v.isDefault) ?? menuItem.variants[0];
        if (dto.variantId && !variant)
            throw new common_1.BadRequestException('Invalid variant');
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
    async validateAndPriceAddons(menuItem, addonIds) {
        const allowed = new Map();
        for (const link of menuItem.addonGroups) {
            for (const addon of link.group.addons) {
                allowed.set(addon.id, { price: Number(addon.price), groupId: link.group.id });
            }
        }
        const byGroup = new Map();
        let total = 0;
        for (const addonId of addonIds) {
            const meta = allowed.get(addonId);
            if (!meta)
                throw new common_1.BadRequestException(`Invalid addon: ${addonId}`);
            total += meta.price;
            const list = byGroup.get(meta.groupId) ?? [];
            list.push(addonId);
            byGroup.set(meta.groupId, list);
        }
        for (const link of menuItem.addonGroups) {
            const selected = byGroup.get(link.group.id) ?? [];
            if (link.group.isRequired && selected.length === 0) {
                throw new common_1.BadRequestException(`Required addon group missing: ${link.group.id}`);
            }
            if (selected.length < link.group.minSelections) {
                throw new common_1.BadRequestException(`Minimum selections not met for addon group`);
            }
            if (selected.length > link.group.maxSelections) {
                throw new common_1.BadRequestException(`Too many addons selected for group`);
            }
        }
        return total;
    }
    async buildAddonRows(menuItem, addonIds) {
        const rows = [];
        const addonMap = new Map();
        for (const link of menuItem.addonGroups) {
            for (const a of link.group.addons) {
                addonMap.set(a.id, { groupId: link.group.id, price: Number(a.price) });
            }
        }
        for (const id of addonIds) {
            const meta = addonMap.get(id);
            if (meta)
                rows.push({ addonId: id, addonGroupId: meta.groupId, price: meta.price });
        }
        return rows;
    }
    async updateItem(userId, cartItemId, dto) {
        const buyerProfileId = await this.getBuyerProfileId(userId);
        const item = await this.prisma.foodCartItem.findFirst({
            where: { id: cartItemId, foodCart: { buyerProfileId } },
        });
        if (!item)
            throw new common_1.NotFoundException('Cart item not found');
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
    async removeItem(userId, cartItemId) {
        const buyerProfileId = await this.getBuyerProfileId(userId);
        const item = await this.prisma.foodCartItem.findFirst({
            where: { id: cartItemId, foodCart: { buyerProfileId } },
        });
        if (!item)
            throw new common_1.NotFoundException('Cart item not found');
        await this.prisma.foodCartItem.delete({ where: { id: cartItemId } });
        await this.cleanupEmptyCart(buyerProfileId);
        return this.getFoodCart(userId);
    }
    async clearCart(userId) {
        const buyerProfileId = await this.getBuyerProfileId(userId);
        await this.prisma.foodCart.deleteMany({ where: { buyerProfileId } });
        return null;
    }
    async cleanupEmptyCart(buyerProfileId) {
        const cart = await this.prisma.foodCart.findFirst({
            where: { buyerProfileId },
            include: { _count: { select: { items: true } } },
        });
        if (cart && cart._count.items === 0) {
            await this.prisma.foodCart.delete({ where: { id: cart.id } });
        }
    }
    toCartView(cart) {
        const packagingFee = Number(cart.store.restaurantProfile?.packagingFee ?? 0);
        const deliveryFee = Number(cart.store.deliveryFee);
        const minOrderAmount = Number(cart.store.restaurantProfile?.minOrderAmount ?? cart.store.minOrderAmount);
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
};
exports.FoodCartService = FoodCartService;
exports.FoodCartService = FoodCartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FoodCartService);
//# sourceMappingURL=food-cart.service.js.map