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
var CheckoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const cart_service_1 = require("../cart/cart.service");
const reservation_service_1 = require("./reservation.service");
const order_cache_service_1 = require("../order/order-cache.service");
const store_promotion_service_1 = require("../promotion/store-promotion.service");
const geospatial_service_1 = require("../geospatial/geospatial.service");
const wallet_loyalty_checkout_service_1 = require("../wallet-loyalty/wallet-loyalty-checkout.service");
const referral_service_1 = require("../wallet-loyalty/referral.service");
const wallet_service_1 = require("../wallet-loyalty/wallet.service");
const order_financials_service_1 = require("../finance/order-financials.service");
const trust_safety_hook_service_1 = require("../trust-safety/trust-safety-hook.service");
const smart_fulfillment_service_1 = require("../fulfillment-network/smart-fulfillment.service");
const corporate_wallet_service_1 = require("../corporate/corporate-wallet.service");
const approval_service_1 = require("../corporate/approval.service");
const client_2 = require("@prisma/client");
const email_notification_service_1 = require("../email/email-notification.service");
const buyer_push_notification_service_1 = require("../push/buyer-push-notification.service");
const location_directory_service_1 = require("../location-directory/location-directory.service");
const delivery_dispatch_service_1 = require("../logistics/delivery-dispatch.service");
const CHECKOUT_TTL_MINUTES = 15;
function generateOrderNumber() {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const rand = (0, crypto_1.randomBytes)(3).toString('hex').toUpperCase();
    return `JD-${ymd}-${rand}`;
}
let CheckoutService = CheckoutService_1 = class CheckoutService {
    constructor(prisma, cartService, reservation, audit, domainEvents, orderCache, promotions, geospatial, walletCheckout, referral, wallet, orderFinancials, trustSafety, smartFulfillment, corporateWallet, corporateApproval, emailNotifications, locations, buyerPush, deliveryDispatch) {
        this.prisma = prisma;
        this.cartService = cartService;
        this.reservation = reservation;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.orderCache = orderCache;
        this.promotions = promotions;
        this.geospatial = geospatial;
        this.walletCheckout = walletCheckout;
        this.referral = referral;
        this.wallet = wallet;
        this.orderFinancials = orderFinancials;
        this.trustSafety = trustSafety;
        this.smartFulfillment = smartFulfillment;
        this.corporateWallet = corporateWallet;
        this.corporateApproval = corporateApproval;
        this.emailNotifications = emailNotifications;
        this.locations = locations;
        this.buyerPush = buyerPush;
        this.deliveryDispatch = deliveryDispatch;
        this.logger = new common_1.Logger(CheckoutService_1.name);
    }
    async initiateCheckout(userId, dto, ipAddress) {
        const cart = await this.cartService.getCart(userId);
        if (!cart || cart.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        await this.validateCartForCheckout(cart);
        await this.validateDeliveryAddress(dto.deliveryAddress);
        if (!dto.payerContact?.name?.trim() || !dto.payerContact?.email?.trim() || !dto.payerContact?.phone?.trim()) {
            throw new common_1.BadRequestException('Payer contact (name, email, and phone) is required for online payment');
        }
        await this.geospatial.validateCheckoutLocation(cart.storeId, dto.deliveryAddress.lat, dto.deliveryAddress.lng, dto.deliveryAddress.pincode);
        if (dto.corporatePurchaseRequestId) {
            await this.validateCorporatePurchaseRequest(userId, dto.corporatePurchaseRequestId, cart.totals.grandTotal);
        }
        const buyerProfile = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!buyerProfile)
            throw new common_1.BadRequestException('Buyer profile not found');
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
            payerContact: dto.payerContact,
        });
        const address = dto.deliveryAddress;
        const checkout = await this.prisma.$transaction(async (tx) => {
            const c = await tx.checkout.create({
                data: {
                    buyerProfileId: buyerProfile.id,
                    storeId: cart.storeId,
                    status: client_1.CheckoutStatus.INITIATED,
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
        try {
            await this.reservation.reserveInventory(checkout.id, cart.items.map((i) => ({
                variantId: i.variantId,
                productId: i.productId,
                quantity: i.quantity,
            })), userId, ipAddress);
        }
        catch (err) {
            await this.prisma.checkout.update({
                where: { id: checkout.id },
                data: { status: client_1.CheckoutStatus.EXPIRED },
            });
            throw err;
        }
        const order = await this.createOrderFromCheckout(checkout.id, cart, buyerProfile.id, address, dto.buyerNote, client_1.PaymentMethod.RAZORPAY, {
            walletAmountToUse: dto.walletAmountToUse,
            rewardPointsToRedeem: dto.rewardPointsToRedeem,
            referralCode: dto.referralCode,
            deviceFingerprint: dto.deviceFingerprint,
        });
        await this.reservation.linkReservationsToOrder(checkout.id, order.id);
        const reserved = await this.prisma.checkout.update({
            where: { id: checkout.id },
            data: { status: client_1.CheckoutStatus.RESERVED, orderId: order.id },
        });
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
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.CHECKOUT_CREATED, 'checkout', checkout.id, { buyerProfileId: buyerProfile.id, storeId: cart.storeId, total: cart.totals.grandTotal, orderId: order.id }, { userId, ipAddress: ipAddress ?? null }),
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
    async initiateCodCheckout(userId, dto, ipAddress) {
        const cart = await this.cartService.getCart(userId);
        if (!cart || cart.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        await this.validateCartForCheckout(cart);
        await this.validateDeliveryAddress(dto.deliveryAddress);
        await this.geospatial.validateCheckoutLocation(cart.storeId, dto.deliveryAddress.lat, dto.deliveryAddress.lng, dto.deliveryAddress.pincode);
        const buyerProfile = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!buyerProfile)
            throw new common_1.BadRequestException('Buyer profile not found');
        const codCheck = await this.trustSafety.beforeCodCheckout(userId);
        if (!codCheck.allowed) {
            throw new common_1.BadRequestException(codCheck.reason ?? 'COD not available');
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
                status: client_1.CheckoutStatus.INITIATED,
                cartSnapshot: cartSnap,
                totalAmount: cart.totals.grandTotal,
                deliveryAddress: { line1: address.line1, line2: address.line2, city: address.city, pincode: address.pincode },
                deliveryLat: address.lat,
                deliveryLng: address.lng,
                buyerNote: dto.buyerNote,
                expiresAt,
            },
        });
        try {
            await this.reservation.reserveInventory(checkout.id, cart.items.map((i) => ({
                variantId: i.variantId,
                productId: i.productId,
                quantity: i.quantity,
            })), userId, ipAddress);
        }
        catch (err) {
            await this.prisma.checkout.update({
                where: { id: checkout.id },
                data: { status: client_1.CheckoutStatus.EXPIRED },
            });
            throw err;
        }
        await this.prisma.checkout.update({
            where: { id: checkout.id },
            data: { status: client_1.CheckoutStatus.RESERVED },
        });
        const order = await this.createOrderFromCheckout(checkout.id, cart, buyerProfile.id, address, dto.buyerNote, client_1.PaymentMethod.COD, {
            walletAmountToUse: dto.walletAmountToUse,
            rewardPointsToRedeem: dto.rewardPointsToRedeem,
            referralCode: dto.referralCode,
            deviceFingerprint: dto.deviceFingerprint,
            corporatePurchaseRequestId: dto.corporatePurchaseRequestId,
        });
        if (dto.corporatePurchaseRequestId) {
            await this.settleCorporateWallet(userId, dto.corporatePurchaseRequestId, cart.totals.grandTotal);
        }
        await this.reservation.linkReservationsToOrder(checkout.id, order.id);
        await this.prisma.checkout.update({
            where: { id: checkout.id },
            data: { status: client_1.CheckoutStatus.COMPLETED, orderId: order.id },
        });
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
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.ORDER_CREATED, 'order', order.id, { checkoutId: checkout.id, buyerProfileId: buyerProfile.id, storeId: cart.storeId }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        this.logger.log({
            orderId: order.id,
            orderNumber: order.orderNumber,
            buyerProfileId: buyerProfile.id,
            storeId: cart.storeId,
            status: order.status,
        }, 'ORDER_CREATED (COD)');
        void this.emailNotifications.sendOrderConfirmation(order.id).catch((err) => {
            this.logger.error({ err, orderId: order.id }, 'Order confirmation email failed');
        });
        void this.buyerPush.notifyOrderPlaced(order.id).catch(() => { });
        void this.orderCache.invalidateAll(order.id);
        this.scheduleRiderDispatch(order.id);
        return { orderId: order.id, orderNumber: order.orderNumber, status: order.status };
    }
    async getCheckout(userId, checkoutId) {
        const buyerProfile = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!buyerProfile)
            throw new common_1.NotFoundException('Buyer profile not found');
        const checkout = await this.prisma.checkout.findUnique({
            where: { id: checkoutId },
            include: { reservations: true },
        });
        if (!checkout)
            throw new common_1.NotFoundException('Checkout not found');
        if (checkout.buyerProfileId !== buyerProfile.id) {
            throw new common_1.ForbiddenException('Checkout does not belong to you');
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
    async confirmOrder(checkoutId, paymentMethod, userId, ipAddress) {
        const checkout = await this.prisma.checkout.findUnique({
            where: { id: checkoutId },
            include: { buyerProfile: { select: { id: true } } },
        });
        if (!checkout)
            throw new common_1.NotFoundException('Checkout not found');
        if (checkout.status !== client_1.CheckoutStatus.RESERVED) {
            throw new common_1.BadRequestException(`Cannot confirm order for checkout in status: ${checkout.status}`);
        }
        const snap = JSON.parse(checkout.cartSnapshot);
        const order = await this.createOrderFromCheckout(checkoutId, snap, checkout.buyerProfileId, checkout.deliveryAddress, checkout.buyerNote ?? undefined, paymentMethod);
        await this.reservation.linkReservationsToOrder(checkoutId, order.id);
        await this.prisma.checkout.update({
            where: { id: checkoutId },
            data: { status: client_1.CheckoutStatus.COMPLETED, orderId: order.id },
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
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.ORDER_CREATED, 'order', order.id, { checkoutId, buyerProfileId: checkout.buyerProfileId, storeId: checkout.storeId }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        void this.orderCache.invalidateAll(order.id);
        return order;
    }
    async createOrderFromCheckout(checkoutId, cart, buyerProfileId, address, buyerNote, paymentMethodInput = client_1.PaymentMethod.RAZORPAY, walletOpts) {
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
        const items = cart.items ?? [];
        const promoDiscount = (totals.offerDiscount ?? 0) + (totals.couponDiscount ?? 0);
        const discountAmount = promoDiscount + (totals.catalogSavings ?? totals.discount ?? 0);
        const couponId = totals.promo?.appliedCoupon?.id ?? null;
        const promotionId = totals.promo?.appliedPromotion?.id ?? null;
        const offerId = totals.promo?.appliedOffer?.id ?? null;
        const cashbackAmount = totals.promo?.cashbackAmount ?? 0;
        const rewardPointsBonus = totals.promo?.rewardPointsBonus ?? 0;
        const gmvImpact = totals.grandTotal ?? 0;
        const pmBase = paymentMethodInput === client_1.PaymentMethod.COD ? 'COD' : 'RAZORPAY';
        const paymentPlan = await this.walletCheckout.computeCheckoutPayment({
            buyerProfileId,
            grandTotal: totals.grandTotal,
            walletAmountToUse: walletOpts?.walletAmountToUse,
            rewardPointsToRedeem: walletOpts?.rewardPointsToRedeem,
            paymentMethod: pmBase,
        });
        const buyerWallet = await this.wallet.getOrCreateWallet(buyerProfileId, walletOpts?.referralCode);
        if (walletOpts?.referralCode && !buyerWallet.referredById) {
            try {
                await this.referral.applyReferralCode(buyerProfileId, walletOpts.referralCode, walletOpts.deviceFingerprint);
            }
            catch {
            }
        }
        const orderDiscount = discountAmount + paymentPlan.pointsDiscount;
        return this.prisma.$transaction(async (tx) => {
            let orderNumber;
            let attempts = 0;
            do {
                orderNumber = generateOrderNumber();
                attempts++;
                if (attempts > 5)
                    throw new Error('Could not generate unique order number');
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
                    ...(paymentPlan.initialPaymentStatus === client_1.PaymentStatus.PAID && { paidAt: new Date() }),
                    items: {
                        create: items.map((i) => ({
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
                    note: paymentPlan.resolvedPaymentMethod === client_1.PaymentMethod.COD ||
                        paymentPlan.resolvedPaymentMethod === client_1.PaymentMethod.WALLET_COD
                        ? 'COD order created'
                        : paymentPlan.resolvedPaymentMethod === client_1.PaymentMethod.WALLET
                            ? 'Order paid via wallet'
                            : 'Order created, awaiting payment',
                    actorType: client_1.OrderActorType.BUYER,
                },
            });
            await this.promotions.redeemOnOrder(tx, order.id, buyerProfileId, couponId, promotionId, offerId, totals.couponDiscount ?? 0, totals.offerDiscount ?? 0, cashbackAmount, rewardPointsBonus, gmvImpact);
            await this.walletCheckout.applyCheckoutDeductions(tx, buyerWallet.id, order.id, paymentPlan.walletAmountUsed, paymentPlan.rewardPointsUsed);
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
                .catch((err) => this.logger.warn(`Financial freeze failed: ${err.message}`));
            if (paymentPlan.walletAmountUsed > 0) {
                await this.wallet.emitWalletDebited(buyerWallet.id, buyerProfileId, paymentPlan.walletAmountUsed, order.id);
            }
            if (cashbackAmount > 0) {
                await this.prisma.$transaction(async (tx) => {
                    await this.wallet.creditWallet(tx, buyerWallet.id, cashbackAmount, client_1.WalletTransactionType.CREDIT, {
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
                    if (!wallet)
                        return;
                    const after = wallet.rewardPoints + rewardPointsBonus;
                    await tx.buyerWallet.update({
                        where: { id: buyerWallet.id },
                        data: { rewardPoints: after, lifetimePoints: { increment: rewardPointsBonus } },
                    });
                    await tx.rewardTransaction.create({
                        data: {
                            walletId: buyerWallet.id,
                            type: client_1.RewardTransactionType.EARN,
                            points: rewardPointsBonus,
                            pointsAfter: after,
                            orderId: order.id,
                            description: 'Campaign offer bonus points',
                            idempotencyKey: `offer-bonus:${order.id}`,
                        },
                    });
                });
            }
            void this.smartFulfillment.allocateOrder(order.id).catch((err) => this.logger.warn(`Fulfillment allocation failed for ${order.id}: ${err.message}`));
            return order;
        });
    }
    async validateDeliveryAddress(address) {
        await this.locations.validatePincode({
            pincode: address.pincode,
            locationCityId: address.locationCityId,
            locationAreaId: address.locationAreaId,
        });
    }
    async validateCartForCheckout(cart) {
        const store = await this.prisma.store.findFirst({
            where: {
                id: cart.storeId,
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
            },
        });
        if (!store)
            throw new common_1.BadRequestException('Store is no longer accepting orders');
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
                throw new common_1.BadRequestException(`Product/variant no longer available: ${item.variant?.name ?? item.variantId}`);
            }
            const available = variant.inventory
                ? variant.inventory.availableQty
                : 0;
            if (available < item.quantity) {
                throw new common_1.ConflictException({
                    code: 'INVENTORY_CHANGED',
                    message: `Only ${available} unit(s) available for "${item.product?.name ?? item.variantId}"`,
                });
            }
        }
    }
    async validateCorporatePurchaseRequest(userId, requestId, amount) {
        const employee = await this.prisma.corporateUser.findFirst({ where: { userId } });
        if (!employee)
            throw new common_1.BadRequestException('Corporate account required');
        const req = await this.prisma.purchaseRequest.findFirst({
            where: { id: requestId, employeeId: employee.id },
            include: { employee: { include: { account: { include: { approvalWorkflows: true } } } } },
        });
        if (!req)
            throw new common_1.BadRequestException('Purchase request not found');
        if (req.status !== client_2.PurchaseRequestStatus.APPROVED) {
            throw new common_1.BadRequestException('Purchase request not approved');
        }
        if (Number(req.amount) < amount) {
            throw new common_1.BadRequestException('Purchase request amount insufficient');
        }
        const limit = Number(req.employee.account.approvalWorkflows[0]?.approvalLimit ?? 0);
        if (this.corporateApproval.needsApproval(amount, limit) && req.status !== client_2.PurchaseRequestStatus.APPROVED) {
            throw new common_1.BadRequestException('Order requires corporate approval');
        }
    }
    async settleCorporateWallet(userId, requestId, amount) {
        const employee = await this.prisma.corporateUser.findFirst({ where: { userId } });
        if (!employee)
            return;
        await this.corporateWallet.debit(employee.accountId, amount);
        await this.prisma.purchaseRequest.update({
            where: { id: requestId },
            data: { status: client_2.PurchaseRequestStatus.APPROVED },
        });
    }
    scheduleRiderDispatch(orderId) {
        void this.deliveryDispatch.dispatchAfterOrderPlaced(orderId).catch((err) => {
            this.logger.error({ orderId, err }, 'Rider dispatch failed after order placed');
        });
    }
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = CheckoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cart_service_1.CartService,
        reservation_service_1.ReservationService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        order_cache_service_1.OrderCacheService,
        store_promotion_service_1.StorePromotionService,
        geospatial_service_1.GeospatialService,
        wallet_loyalty_checkout_service_1.WalletLoyaltyCheckoutService,
        referral_service_1.ReferralService,
        wallet_service_1.WalletService,
        order_financials_service_1.OrderFinancialsService,
        trust_safety_hook_service_1.TrustSafetyHookService,
        smart_fulfillment_service_1.SmartFulfillmentService,
        corporate_wallet_service_1.CorporateWalletService,
        approval_service_1.ApprovalService,
        email_notification_service_1.EmailNotificationService,
        location_directory_service_1.LocationDirectoryService,
        buyer_push_notification_service_1.BuyerPushNotificationService,
        delivery_dispatch_service_1.DeliveryDispatchService])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map