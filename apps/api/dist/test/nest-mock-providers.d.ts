export declare const stub: <T extends object>(methods: T) => T;
export declare const checkoutServiceMocks: {
    orderCache: {
        invalidateAll: any;
    };
    promotions: {
        redeemOnOrder: any;
        applyPromoToCart: any;
        recalculateCartTotals: any;
    };
    geospatial: {
        validateCheckoutLocation: any;
    };
    walletCheckout: {
        computeCheckoutPayment: any;
        applyCheckoutDeductions: any;
    };
    referral: {
        applyReferralCode: any;
    };
    wallet: {
        getOrCreateWallet: any;
        emitWalletDebited: any;
    };
    orderFinancials: {
        freezeOnOrderCreate: any;
    };
    trustSafety: {
        beforeCodCheckout: any;
    };
    smartFulfillment: {
        allocateOrder: any;
    };
    corporateWallet: {
        debitForPurchase: any;
    };
    corporateApproval: {
        markApproved: any;
    };
    emailNotifications: {
        sendOrderConfirmation: any;
    };
    buyerPush: {
        notifyOrderPlaced: any;
    };
    deliveryDispatch: {
        dispatchAfterOrderPlaced: any;
    };
};
export declare const orderServiceMocks: {
    deliveryDispatch: {
        dispatchAfterReadyForPickup: any;
        dispatchAfterOrderPlaced: any;
    };
    rewards: {
        creditPointsForOrder: any;
        refundWalletForOrder: any;
    };
    ledger: {
        recordRefund: any;
        recordOrderPayment: any;
    };
    creditNotes: {
        createForOrderCancellation: any;
        createForRefund: any;
    };
    emailNotifications: {
        sendOrderConfirmation: any;
        sendRefundProcessed: any;
    };
    buyerPush: {
        notifyOrderAccepted: any;
        notifyReadyForPickup: any;
    };
    tracking: {
        emitOrderStatus: any;
        publishUpdate: any;
        emitDeliveryEvent: any;
    };
};
export declare const deliveryServiceMocks: {
    settlement: {
        settleOrder: any;
        createLedgerForDeliveredOrder: any;
    };
    cod: {
        recordCollection: any;
        createForDeliveredOrder: any;
    };
    reservation: {
        fulfillOnDelivery: any;
        releaseOrderReservations: any;
    };
    statusHistory: {
        transition: any;
        appendEntry: any;
    };
    tracking: {
        publishUpdate: any;
        emitOrderStatus: any;
        emitDeliveryEvent: any;
    };
    walletLoyalty: {
        processOrderCompleted: any;
    };
    referral: {
        creditReferrerOnFirstOrder: any;
    };
    invoiceEngine: {
        generateForOrder: any;
    };
    tdsTcs: {
        recordForOrder: any;
        syncMonthlyTotals: any;
    };
    trustSafety: {
        afterDelivery: any;
        onOrderDelivered: any;
    };
    emailNotifications: {
        sendDeliveryConfirmation: any;
        sendOrderDelivered: any;
    };
    buyerPush: {
        notifyDelivered: any;
        notifyOutForDelivery: any;
    };
};
