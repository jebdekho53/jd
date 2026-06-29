"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryServiceMocks = exports.orderServiceMocks = exports.checkoutServiceMocks = exports.stub = void 0;
const stub = (methods) => methods;
exports.stub = stub;
exports.checkoutServiceMocks = {
    orderCache: (0, exports.stub)({ invalidateAll: jest.fn() }),
    promotions: (0, exports.stub)({ redeemOnOrder: jest.fn(), applyPromoToCart: jest.fn(), recalculateCartTotals: jest.fn() }),
    geospatial: (0, exports.stub)({
        validateCheckoutLocation: jest.fn().mockResolvedValue(undefined),
    }),
    walletCheckout: (0, exports.stub)({
        computeCheckoutPayment: jest.fn().mockResolvedValue({
            walletAmountUsed: 0,
            rewardPointsUsed: 0,
            pointsDiscount: 0,
            amountDue: 220,
            razorpayAmount: 220,
            resolvedPaymentMethod: 'RAZORPAY',
            initialOrderStatus: 'PAYMENT_PENDING',
            initialPaymentStatus: 'PENDING',
        }),
        applyCheckoutDeductions: jest.fn(),
    }),
    referral: (0, exports.stub)({ applyReferralCode: jest.fn() }),
    wallet: (0, exports.stub)({
        getOrCreateWallet: jest.fn().mockResolvedValue({ id: 'w1', balance: 0, rewardPoints: 0 }),
        emitWalletDebited: jest.fn(),
    }),
    orderFinancials: (0, exports.stub)({ freezeOnOrderCreate: jest.fn().mockResolvedValue(undefined) }),
    trustSafety: (0, exports.stub)({ beforeCodCheckout: jest.fn().mockResolvedValue({ allowed: true }) }),
    smartFulfillment: (0, exports.stub)({ allocateOrder: jest.fn().mockResolvedValue(undefined) }),
    corporateWallet: (0, exports.stub)({ debitForPurchase: jest.fn() }),
    corporateApproval: (0, exports.stub)({ markApproved: jest.fn() }),
    emailNotifications: (0, exports.stub)({ sendOrderConfirmation: jest.fn().mockResolvedValue(undefined) }),
    buyerPush: (0, exports.stub)({ notifyOrderPlaced: jest.fn().mockResolvedValue(undefined) }),
    deliveryDispatch: (0, exports.stub)({ dispatchAfterOrderPlaced: jest.fn().mockResolvedValue(null) }),
};
exports.orderServiceMocks = {
    deliveryDispatch: (0, exports.stub)({
        dispatchAfterReadyForPickup: jest.fn().mockResolvedValue({
            mode: 'own_fleet',
            deliveryId: 'del1',
            riderProfileId: 'rp1',
        }),
        dispatchAfterOrderPlaced: jest.fn().mockResolvedValue(null),
    }),
    rewards: (0, exports.stub)({
        creditPointsForOrder: jest.fn(),
        refundWalletForOrder: jest.fn().mockResolvedValue(undefined),
    }),
    ledger: (0, exports.stub)({ recordRefund: jest.fn().mockResolvedValue(undefined), recordOrderPayment: jest.fn() }),
    creditNotes: (0, exports.stub)({
        createForOrderCancellation: jest.fn(),
        createForRefund: jest.fn().mockResolvedValue(undefined),
    }),
    emailNotifications: (0, exports.stub)({
        sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
        sendRefundProcessed: jest.fn().mockResolvedValue(undefined),
    }),
    buyerPush: (0, exports.stub)({
        notifyOrderAccepted: jest.fn().mockResolvedValue(undefined),
        notifyReadyForPickup: jest.fn().mockResolvedValue(undefined),
    }),
    tracking: (0, exports.stub)({ emitOrderStatus: jest.fn(), publishUpdate: jest.fn(), emitDeliveryEvent: jest.fn() }),
};
exports.deliveryServiceMocks = {
    settlement: (0, exports.stub)({
        settleOrder: jest.fn(),
        createLedgerForDeliveredOrder: jest.fn().mockResolvedValue(undefined),
    }),
    cod: (0, exports.stub)({
        recordCollection: jest.fn(),
        createForDeliveredOrder: jest.fn().mockResolvedValue(undefined),
    }),
    reservation: (0, exports.stub)({
        fulfillOnDelivery: jest.fn().mockResolvedValue(undefined),
        releaseOrderReservations: jest.fn(),
    }),
    statusHistory: (0, exports.stub)({
        transition: jest.fn().mockResolvedValue(true),
        appendEntry: jest.fn().mockResolvedValue(undefined),
    }),
    tracking: (0, exports.stub)({ publishUpdate: jest.fn(), emitOrderStatus: jest.fn(), emitDeliveryEvent: jest.fn() }),
    walletLoyalty: (0, exports.stub)({ processOrderCompleted: jest.fn().mockResolvedValue(undefined) }),
    referral: (0, exports.stub)({ creditReferrerOnFirstOrder: jest.fn() }),
    invoiceEngine: (0, exports.stub)({ generateForOrder: jest.fn().mockResolvedValue(undefined) }),
    tdsTcs: (0, exports.stub)({ recordForOrder: jest.fn(), syncMonthlyTotals: jest.fn().mockResolvedValue(undefined) }),
    trustSafety: (0, exports.stub)({ afterDelivery: jest.fn(), onOrderDelivered: jest.fn().mockResolvedValue(undefined) }),
    emailNotifications: (0, exports.stub)({
        sendDeliveryConfirmation: jest.fn().mockResolvedValue(undefined),
        sendOrderDelivered: jest.fn().mockResolvedValue(undefined),
    }),
    buyerPush: (0, exports.stub)({
        notifyDelivered: jest.fn().mockResolvedValue(undefined),
        notifyOutForDelivery: jest.fn().mockResolvedValue(undefined),
    }),
};
//# sourceMappingURL=nest-mock-providers.js.map