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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CartService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const cart_cache_service_1 = require("./cart-cache.service");
const store_promotion_service_1 = require("../promotion/store-promotion.service");
const membership_benefit_service_1 = require("../membership/membership-benefit.service");
const product_return_policy_util_1 = require("../../common/utils/product-return-policy.util");
let CartService = CartService_1 = class CartService {
    constructor(prisma, audit, domainEvents, cartCache, promotions, membershipBenefits) {
        this.prisma = prisma;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.cartCache = cartCache;
        this.promotions = promotions;
        this.membershipBenefits = membershipBenefits;
        this.logger = new common_1.Logger(CartService_1.name);
    }
    async getBuyerProfileId(userId) {
        const { id } = await this.getOrCreateBuyerProfile(userId);
        return id;
    }
    async invalidateCache(userId) {
        const { id } = await this.getOrCreateBuyerProfile(userId);
        await this.cartCache.invalidate(id);
    }
    async getOrCreateBuyerProfile(userId) {
        const existing = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (existing)
            return existing;
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
    async getCart(userId) {
        const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);
        const cached = await this.cartCache.get(buyerProfileId);
        if (cached)
            return cached;
        const cart = await this.loadCartFromDb(buyerProfileId);
        if (cart)
            await this.cartCache.set(buyerProfileId, cart);
        return cart;
    }
    async addItem(userId, dto, ipAddress) {
        const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);
        const { variant, product, store } = await this.resolveVariant(dto.productId, dto.variantId);
        const availableQty = this.availableQty(variant.inventory);
        if (availableQty <= 0) {
            throw new common_1.ConflictException({
                code: 'INVENTORY_CHANGED',
                message: `"${product.name}" is out of stock`,
            });
        }
        let cart = await this.prisma.cart.findFirst({
            where: { buyerProfileId },
        });
        if (cart && cart.storeId !== store.id) {
            throw new common_1.ConflictException(`Your cart already contains items from "${await this.getStoreName(cart.storeId)}". ` +
                `Clear your cart before adding items from a different store.`);
        }
        const isNewCart = !cart;
        cart = await this.prisma.$transaction(async (tx) => {
            const c = await tx.cart.upsert({
                where: { buyerProfileId_storeId: { buyerProfileId, storeId: store.id } },
                update: {},
                create: { buyerProfileId, storeId: store.id },
            });
            const existing = await tx.cartItem.findUnique({
                where: { cartId_variantId: { cartId: c.id, variantId: dto.variantId } },
            });
            const newQty = (existing?.quantity ?? 0) + dto.quantity;
            if (newQty > availableQty) {
                throw new common_1.ConflictException({
                    code: 'INVENTORY_CHANGED',
                    message: `Only ${availableQty} unit(s) of "${product.name}" are available. ` +
                        `You already have ${existing?.quantity ?? 0} in your cart.`,
                });
            }
            if (existing) {
                await tx.cartItem.update({
                    where: { id: existing.id },
                    data: { quantity: newQty },
                });
            }
            else {
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
        if (!cartView)
            throw new common_1.NotFoundException('Cart not found after creation');
        await this.cartCache.set(buyerProfileId, cartView);
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
                },
            }),
            this.domainEvents.emit(isNewCart ? client_1.DomainEventType.CART_CREATED : client_1.DomainEventType.CART_ITEM_ADDED, 'cart', cart.id, { buyerProfileId, storeId: store.id, productId: dto.productId }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.debug({ userId, cartId: cart.id }, isNewCart ? 'Cart created' : 'Item added');
        return cartView;
    }
    async updateItem(userId, cartItemId, dto, ipAddress) {
        const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);
        const cartItem = await this.assertCartItemOwnership(cartItemId, buyerProfileId);
        if (dto.quantity === 0) {
            return this.removeItemById(userId, buyerProfileId, cartItem, ipAddress);
        }
        const { variant, product } = await this.resolveVariant(cartItem.productId, cartItem.variantId);
        const available = this.availableQty(variant.inventory);
        if (dto.quantity > available) {
            throw new common_1.ConflictException({
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
        if (!cartView)
            throw new common_1.NotFoundException('Cart not found');
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
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.CART_UPDATED, 'cart', cartItem.cartId, { buyerProfileId, cartItemId, quantity: dto.quantity }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        return cartView;
    }
    async removeItem(userId, cartItemId, ipAddress) {
        const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);
        const cartItem = await this.assertCartItemOwnership(cartItemId, buyerProfileId);
        return this.removeItemById(userId, buyerProfileId, cartItem, ipAddress);
    }
    async clearCart(userId, ipAddress) {
        const { id: buyerProfileId } = await this.getOrCreateBuyerProfile(userId);
        const cart = await this.prisma.cart.findFirst({ where: { buyerProfileId } });
        if (!cart)
            return;
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
                metadata: { storeId: cart.storeId },
            }),
            this.domainEvents.emit(client_1.DomainEventType.CART_CLEARED, 'cart', cart.id, { buyerProfileId, storeId: cart.storeId }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.debug({ userId, cartId: cart.id }, 'Cart cleared');
    }
    async loadCartFromDb(buyerProfileId) {
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
        if (!cart)
            return null;
        const items = cart.items.map((item) => {
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
                returnPolicy: (0, product_return_policy_util_1.buildReturnPolicySummary)({
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
        const enriched = await this.promotions.enrichCartPromotions(cart.id, cart.storeId, buyerProfileId, baseDeliveryFee, catalogSavings, promoItems, cart.appliedCouponId, cart.appliedPromotionId, cart.appliedOfferId);
        let appliedCouponCode = null;
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
    async resolveVariant(productId, variantId) {
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
            throw new common_1.BadRequestException(`Product/variant not found or not available: productId=${productId}, variantId=${variantId}`);
        }
        const store = await this.prisma.store.findFirst({
            where: {
                id: variant.product.storeId,
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
            },
            select: { id: true, name: true, slug: true, deliveryFee: true },
        });
        if (!store) {
            throw new common_1.BadRequestException('Store is not currently accepting orders');
        }
        return { variant, product: variant.product, store };
    }
    availableQty(inv) {
        if (!inv || inv.status === 'DISABLED')
            return 0;
        return Math.max(0, inv.availableQty);
    }
    async assertCartItemOwnership(cartItemId, buyerProfileId) {
        const item = await this.prisma.cartItem.findUnique({
            where: { id: cartItemId },
            select: { id: true, cartId: true, productId: true, variantId: true, quantity: true, cart: { select: { buyerProfileId: true } } },
        });
        if (!item)
            throw new common_1.NotFoundException(`Cart item not found: ${cartItemId}`);
        if (item.cart.buyerProfileId !== buyerProfileId) {
            throw new common_1.ForbiddenException('Cart item does not belong to you');
        }
        return item;
    }
    async removeItemById(userId, buyerProfileId, cartItem, ipAddress) {
        await this.prisma.cartItem.delete({ where: { id: cartItem.id } });
        const remaining = await this.prisma.cartItem.count({
            where: { cartId: cartItem.cartId },
        });
        if (remaining === 0) {
            await this.prisma.cart.delete({ where: { id: cartItem.cartId } });
        }
        await this.cartCache.invalidate(buyerProfileId);
        const cartView = await this.loadCartFromDb(buyerProfileId);
        if (cartView)
            await this.cartCache.set(buyerProfileId, cartView);
        void Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'CART_ITEM_REMOVED',
                resourceType: 'cart_item',
                resourceId: cartItem.id,
                ipAddress,
                metadata: { cartId: cartItem.cartId },
            }),
            this.domainEvents.emit(client_1.DomainEventType.CART_ITEM_REMOVED, 'cart', cartItem.cartId, { buyerProfileId, cartItemId: cartItem.id }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        return cartView;
    }
    async getStoreName(storeId) {
        const s = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { name: true },
        });
        return s?.name ?? storeId;
    }
};
exports.CartService = CartService;
exports.CartService = CartService = CartService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => store_promotion_service_1.StorePromotionService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        cart_cache_service_1.CartCacheService,
        store_promotion_service_1.StorePromotionService,
        membership_benefit_service_1.MembershipBenefitService])
], CartService);
//# sourceMappingURL=cart.service.js.map