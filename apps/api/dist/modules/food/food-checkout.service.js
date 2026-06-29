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
var FoodCheckoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodCheckoutService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const food_cart_service_1 = require("./food-cart.service");
const geospatial_service_1 = require("../geospatial/geospatial.service");
const CHECKOUT_TTL_MINUTES = 15;
const FOOD_CHECKOUT_PENDING = 'PENDING';
const FOOD_CHECKOUT_PROCESSING = 'PROCESSING';
const FOOD_CHECKOUT_COMPLETED = 'COMPLETED';
function generateOrderNumber() {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const rand = (0, crypto_1.randomBytes)(3).toString('hex').toUpperCase();
    return `JDF-${ymd}-${rand}`;
}
let FoodCheckoutService = FoodCheckoutService_1 = class FoodCheckoutService {
    constructor(prisma, foodCart, audit, domainEvents, geospatial) {
        this.prisma = prisma;
        this.foodCart = foodCart;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.geospatial = geospatial;
        this.logger = new common_1.Logger(FoodCheckoutService_1.name);
    }
    async initiateCheckout(userId, dto, idempotencyKey) {
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
            throw new common_1.BadRequestException('Food cart is empty');
        }
        const minOrder = this.effectiveMinOrder(cart);
        if (cart.totals.subtotal < minOrder) {
            throw new common_1.BadRequestException(`Minimum order amount is ₹${minOrder}`);
        }
        await this.validateCartAvailability(cart.items.map((i) => i.menuItemId));
        await this.geospatial.validateCheckoutLocation(cart.storeId, dto.deliveryLat, dto.deliveryLng, typeof dto.deliveryAddress.pincode === 'string' ? dto.deliveryAddress.pincode : undefined);
        const tipAmount = dto.tipAmount ?? 0;
        const couponDiscount = dto.couponDiscount ?? 0;
        const totalAmount = cart.totals.grandTotal + tipAmount - couponDiscount;
        const buyerProfile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!buyerProfile)
            throw new common_1.NotFoundException('Buyer profile not found');
        const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
        if (dto.paymentMethod === client_1.PaymentMethod.COD) {
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
        const cartSnapshot = {
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
                deliveryAddress: dto.deliveryAddress,
                deliveryLat: dto.deliveryLat,
                deliveryLng: dto.deliveryLng,
                scheduledDeliveryAt: dto.scheduledDeliveryAt ? new Date(dto.scheduledDeliveryAt) : null,
                specialInstructions: dto.specialInstructions,
                restaurantNote: dto.restaurantNote,
                paymentMethod: dto.paymentMethod,
                idempotencyKey,
                cartSnapshot: cartSnapshot,
                expiresAt,
            },
        });
        return { checkoutId: checkout.id, totalAmount, expiresAt };
    }
    async createPaidOrderFromCheckout(opts) {
        const checkout = await this.prisma.foodCheckout.findUnique({
            where: { id: opts.checkoutId },
        });
        if (!checkout)
            throw new common_1.NotFoundException('Food checkout not found');
        if (checkout.status === FOOD_CHECKOUT_COMPLETED && checkout.orderId) {
            const existing = await this.prisma.order.findUnique({ where: { id: checkout.orderId } });
            if (!existing)
                throw new common_1.NotFoundException('Order not found');
            return { orderId: existing.id, orderNumber: existing.orderNumber };
        }
        const snapshot = checkout.cartSnapshot;
        if (!snapshot?.items?.length) {
            throw new common_1.BadRequestException('Food checkout cart snapshot is invalid');
        }
        const order = await this.prisma.$transaction(async (tx) => {
            const claimed = await tx.foodCheckout.updateMany({
                where: { id: checkout.id, status: FOOD_CHECKOUT_PENDING },
                data: { status: FOOD_CHECKOUT_PROCESSING },
            });
            if (claimed.count === 0) {
                const current = await tx.foodCheckout.findUnique({ where: { id: checkout.id } });
                if (current?.status === FOOD_CHECKOUT_COMPLETED && current.orderId) {
                    const existing = await tx.order.findUnique({ where: { id: current.orderId } });
                    if (existing)
                        return existing;
                }
                throw new common_1.ConflictException('Food checkout is already being processed');
            }
            const created = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    buyerProfileId: opts.buyerProfileId,
                    storeId: snapshot.storeId,
                    status: client_1.OrderStatus.PAID,
                    paymentMethod: client_1.PaymentMethod.RAZORPAY,
                    paymentStatus: client_1.PaymentStatus.PAID,
                    orderVertical: client_1.OrderVertical.FOOD,
                    subtotal: snapshot.totals.subtotal,
                    deliveryFee: snapshot.totals.deliveryFee,
                    packagingFee: snapshot.totals.packagingFee,
                    taxAmount: snapshot.totals.tax,
                    tipAmount: snapshot.tipAmount,
                    discountAmount: snapshot.couponDiscount,
                    totalAmount: snapshot.totalAmount,
                    deliveryAddress: snapshot.dto.deliveryAddress,
                    deliveryLat: snapshot.dto.deliveryLat,
                    deliveryLng: snapshot.dto.deliveryLng,
                    scheduledDeliveryAt: snapshot.dto.scheduledDeliveryAt
                        ? new Date(snapshot.dto.scheduledDeliveryAt)
                        : null,
                    specialInstructions: snapshot.dto.specialInstructions,
                    restaurantNote: snapshot.dto.restaurantNote,
                    kitchenStatus: client_1.FoodKitchenStatus.NEW,
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
                            status: client_1.OrderStatus.PAID,
                            actorType: client_1.OrderActorType.BUYER,
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
                    method: client_1.PaymentMethod.RAZORPAY,
                    status: client_1.PaymentStatus.PAID,
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
        await this.audit.log({
            actorId: opts.userId,
            action: 'FOOD_ORDER_CREATED',
            resourceType: 'Order',
            resourceId: order.id,
        });
        void this.domainEvents.emit(client_1.DomainEventType.ORDER_CREATED, 'Order', order.id, {
            vertical: client_1.OrderVertical.FOOD,
            paymentMethod: client_1.PaymentMethod.RAZORPAY,
        });
        return { orderId: order.id, orderNumber: order.orderNumber };
    }
    async createFoodOrderFromCart(params) {
        const { buyerProfileId, userId, cart, dto, totalAmount, tipAmount, couponDiscount, idempotencyKey } = params;
        const order = await this.prisma.$transaction(async (tx) => {
            const created = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    buyerProfileId,
                    storeId: cart.storeId,
                    status: client_1.OrderStatus.MERCHANT_ACCEPTED,
                    paymentMethod: client_1.PaymentMethod.COD,
                    paymentStatus: client_1.PaymentStatus.PENDING,
                    orderVertical: client_1.OrderVertical.FOOD,
                    subtotal: cart.totals.subtotal,
                    deliveryFee: cart.totals.deliveryFee,
                    packagingFee: cart.totals.packagingFee,
                    taxAmount: cart.totals.tax,
                    tipAmount,
                    discountAmount: couponDiscount,
                    totalAmount,
                    deliveryAddress: dto.deliveryAddress,
                    deliveryLat: dto.deliveryLat,
                    deliveryLng: dto.deliveryLng,
                    scheduledDeliveryAt: dto.scheduledDeliveryAt ? new Date(dto.scheduledDeliveryAt) : null,
                    specialInstructions: dto.specialInstructions,
                    restaurantNote: dto.restaurantNote,
                    kitchenStatus: client_1.FoodKitchenStatus.NEW,
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
                            status: client_1.OrderStatus.MERCHANT_ACCEPTED,
                            actorType: client_1.OrderActorType.BUYER,
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
        await this.audit.log({
            actorId: userId,
            action: 'FOOD_ORDER_CREATED',
            resourceType: 'Order',
            resourceId: order.id,
        });
        void this.domainEvents.emit(client_1.DomainEventType.ORDER_CREATED, 'Order', order.id, {
            vertical: client_1.OrderVertical.FOOD,
            paymentMethod: client_1.PaymentMethod.COD,
        });
        return { orderId: order.id, orderNumber: order.orderNumber, status: order.status };
    }
    async getCheckoutStatus(checkoutId, userId) {
        const buyerProfile = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!buyerProfile)
            throw new common_1.NotFoundException('Buyer profile not found');
        const checkout = await this.prisma.foodCheckout.findFirst({
            where: { id: checkoutId, buyerProfileId: buyerProfile.id },
        });
        if (!checkout)
            throw new common_1.NotFoundException('Checkout not found');
        return checkout;
    }
    effectiveMinOrder(cart) {
        return cart.store.minOrderAmount;
    }
    async validateCartAvailability(menuItemIds) {
        const unavailable = await this.prisma.restaurantMenuItem.count({
            where: {
                id: { in: menuItemIds },
                OR: [
                    { isActive: false },
                    { availability: { not: client_1.MenuItemAvailability.AVAILABLE } },
                ],
            },
        });
        if (unavailable > 0) {
            throw new common_1.BadRequestException('One or more menu items are no longer available');
        }
    }
};
exports.FoodCheckoutService = FoodCheckoutService;
exports.FoodCheckoutService = FoodCheckoutService = FoodCheckoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        food_cart_service_1.FoodCartService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        geospatial_service_1.GeospatialService])
], FoodCheckoutService);
//# sourceMappingURL=food-checkout.service.js.map