export declare const stub: <T extends object>(methods: T) => T;
export declare const checkoutServiceMocks: {
    orderCache: {
        invalidateAll: jest.Mock<any, any, any>;
    };
    promotions: {
        redeemOnOrder: jest.Mock<any, any, any>;
        applyPromoToCart: jest.Mock<any, any, any>;
        recalculateCartTotals: jest.Mock<any, any, any>;
    };
    geospatial: {
        validateCheckoutLocation: jest.Mock<any, any, any>;
    };
    walletCheckout: {
        computeCheckoutPayment: jest.Mock<any, any, any>;
        applyCheckoutDeductions: jest.Mock<any, any, any>;
    };
    referral: {
        applyReferralCode: jest.Mock<any, any, any>;
    };
    wallet: {
        getOrCreateWallet: jest.Mock<any, any, any>;
        emitWalletDebited: jest.Mock<any, any, any>;
    };
    orderFinancials: {
        freezeOnOrderCreate: jest.Mock<any, any, any>;
    };
    trustSafety: {
        beforeCodCheckout: jest.Mock<any, any, any>;
    };
    smartFulfillment: {
        allocateOrder: jest.Mock<any, any, any>;
    };
    corporateWallet: {
        debitForPurchase: jest.Mock<any, any, any>;
    };
    corporateApproval: {
        markApproved: jest.Mock<any, any, any>;
    };
    emailNotifications: {
        sendOrderConfirmation: jest.Mock<any, any, any>;
    };
    buyerPush: {
        notifyOrderPlaced: jest.Mock<any, any, any>;
    };
    deliveryDispatch: {
        dispatchAfterOrderPlaced: jest.Mock<any, any, any>;
    };
};
export declare const orderServiceMocks: {
    deliveryDispatch: {
        dispatchAfterReadyForPickup: jest.Mock<any, any, any>;
        dispatchAfterOrderPlaced: jest.Mock<any, any, any>;
    };
    rewards: {
        creditPointsForOrder: jest.Mock<any, any, any>;
        refundWalletForOrder: jest.Mock<any, any, any>;
    };
    ledger: {
        recordRefund: jest.Mock<any, any, any>;
        recordOrderPayment: jest.Mock<any, any, any>;
    };
    creditNotes: {
        createForOrderCancellation: jest.Mock<any, any, any>;
        createForRefund: jest.Mock<any, any, any>;
    };
    emailNotifications: {
        sendOrderConfirmation: jest.Mock<any, any, any>;
        sendRefundProcessed: jest.Mock<any, any, any>;
    };
    buyerPush: {
        notifyOrderAccepted: jest.Mock<any, any, any>;
        notifyReadyForPickup: jest.Mock<any, any, any>;
    };
    tracking: {
        emitOrderStatus: jest.Mock<any, any, any>;
        publishUpdate: jest.Mock<any, any, any>;
        emitDeliveryEvent: jest.Mock<any, any, any>;
    };
};
export declare const deliveryServiceMocks: {
    settlement: {
        settleOrder: jest.Mock<any, any, any>;
        createLedgerForDeliveredOrder: jest.Mock<any, any, any>;
    };
    cod: {
        recordCollection: jest.Mock<any, any, any>;
        createForDeliveredOrder: jest.Mock<any, any, any>;
    };
    reservation: {
        fulfillOnDelivery: jest.Mock<any, any, any>;
        releaseOrderReservations: jest.Mock<any, any, any>;
    };
    statusHistory: {
        transition: jest.Mock<any, any, any>;
        appendEntry: jest.Mock<any, any, any>;
    };
    tracking: {
        publishUpdate: jest.Mock<any, any, any>;
        emitOrderStatus: jest.Mock<any, any, any>;
        emitDeliveryEvent: jest.Mock<any, any, any>;
    };
    walletLoyalty: {
        processOrderCompleted: jest.Mock<any, any, any>;
    };
    referral: {
        creditReferrerOnFirstOrder: jest.Mock<any, any, any>;
    };
    invoiceEngine: {
        generateForOrder: jest.Mock<any, any, any>;
    };
    tdsTcs: {
        recordForOrder: jest.Mock<any, any, any>;
        syncMonthlyTotals: jest.Mock<any, any, any>;
    };
    trustSafety: {
        afterDelivery: jest.Mock<any, any, any>;
        onOrderDelivered: jest.Mock<any, any, any>;
    };
    emailNotifications: {
        sendDeliveryConfirmation: jest.Mock<any, any, any>;
        sendOrderDelivered: jest.Mock<any, any, any>;
    };
    buyerPush: {
        notifyDelivered: jest.Mock<any, any, any>;
        notifyOutForDelivery: jest.Mock<any, any, any>;
    };
};
