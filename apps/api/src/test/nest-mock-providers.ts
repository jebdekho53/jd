/** Lightweight Nest provider stubs for unit tests — keep in sync with service constructors. */

export const stub = <T extends object>(methods: T): T => methods;

export const checkoutServiceMocks = {
  orderCache: stub({ invalidateAll: jest.fn() }),
  promotions: stub({ redeemOnOrder: jest.fn(), applyPromoToCart: jest.fn(), recalculateCartTotals: jest.fn() }),
  geospatial: stub({
    validateCheckoutLocation: jest.fn().mockResolvedValue(undefined),
  }),
  walletCheckout: stub({
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
  referral: stub({ applyReferralCode: jest.fn() }),
  wallet: stub({
    getOrCreateWallet: jest.fn().mockResolvedValue({ id: 'w1', balance: 0, rewardPoints: 0 }),
    emitWalletDebited: jest.fn(),
  }),
  orderFinancials: stub({ freezeOnOrderCreate: jest.fn().mockResolvedValue(undefined) }),
  trustSafety: stub({ beforeCodCheckout: jest.fn().mockResolvedValue({ allowed: true }) }),
  smartFulfillment: stub({ allocateOrder: jest.fn().mockResolvedValue(undefined) }),
  corporateWallet: stub({ debitForPurchase: jest.fn() }),
  corporateApproval: stub({ markApproved: jest.fn() }),
  emailNotifications: stub({
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    sendMerchantNewOrder: jest.fn().mockResolvedValue(undefined),
  }),
  buyerPush: stub({ notifyOrderPlaced: jest.fn().mockResolvedValue(undefined) }),
  deliveryDispatch: stub({ dispatchAfterOrderPlaced: jest.fn().mockResolvedValue(null) }),
};

export const orderServiceMocks = {
  deliveryDispatch: stub({
    dispatchAfterReadyForPickup: jest.fn().mockResolvedValue({
      mode: 'own_fleet',
      deliveryId: 'del1',
      riderProfileId: 'rp1',
    }),
    dispatchAfterOrderPlaced: jest.fn().mockResolvedValue(null),
  }),
  rewards: stub({
    creditPointsForOrder: jest.fn(),
    refundWalletForOrder: jest.fn().mockResolvedValue(undefined),
  }),
  ledger: stub({ recordRefund: jest.fn().mockResolvedValue(undefined), recordOrderPayment: jest.fn() }),
  creditNotes: stub({
    createForOrderCancellation: jest.fn(),
    createForRefund: jest.fn().mockResolvedValue(undefined),
  }),
  emailNotifications: stub({
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    sendMerchantNewOrder: jest.fn().mockResolvedValue(undefined),
    sendRefundProcessed: jest.fn().mockResolvedValue(undefined),
    sendBuyerOrderCancelled: jest.fn().mockResolvedValue(undefined),
    sendMerchantOrderCancelled: jest.fn().mockResolvedValue(undefined),
    sendBuyerMerchantAccepted: jest.fn().mockResolvedValue(undefined),
    sendBuyerMerchantRejectedOrCancelled: jest.fn().mockResolvedValue(undefined),
    sendAdminDeliveryFailedOrDelayed: jest.fn().mockResolvedValue(undefined),
  }),
  buyerPush: stub({
    notifyOrderAccepted: jest.fn().mockResolvedValue(undefined),
    notifyReadyForPickup: jest.fn().mockResolvedValue(undefined),
  }),
  tracking: stub({ emitOrderStatus: jest.fn(), publishUpdate: jest.fn(), emitDeliveryEvent: jest.fn() }),
};

export const deliveryServiceMocks = {
  settlement: stub({
    settleOrder: jest.fn(),
    createLedgerForDeliveredOrder: jest.fn().mockResolvedValue(undefined),
  }),
  cod: stub({
    recordCollection: jest.fn(),
    createForDeliveredOrder: jest.fn().mockResolvedValue(undefined),
  }),
  reservation: stub({
    fulfillOnDelivery: jest.fn().mockResolvedValue(undefined),
    releaseOrderReservations: jest.fn(),
  }),
  statusHistory: stub({
    transition: jest.fn().mockResolvedValue(true),
    appendEntry: jest.fn().mockResolvedValue(undefined),
  }),
  tracking: stub({ publishUpdate: jest.fn(), emitOrderStatus: jest.fn(), emitDeliveryEvent: jest.fn() }),
  walletLoyalty: stub({ processOrderCompleted: jest.fn().mockResolvedValue(undefined) }),
  referral: stub({ creditReferrerOnFirstOrder: jest.fn() }),
  invoiceEngine: stub({ generateForOrder: jest.fn().mockResolvedValue(undefined) }),
  tdsTcs: stub({ recordForOrder: jest.fn(), syncMonthlyTotals: jest.fn().mockResolvedValue(undefined) }),
  trustSafety: stub({ afterDelivery: jest.fn(), onOrderDelivered: jest.fn().mockResolvedValue(undefined) }),
  emailNotifications: stub({
    sendDeliveryConfirmation: jest.fn().mockResolvedValue(undefined),
    sendOrderDelivered: jest.fn().mockResolvedValue(undefined),
    sendBuyerPickedUpOrOutForDelivery: jest.fn().mockResolvedValue(undefined),
    sendAdminDeliveryFailedOrDelayed: jest.fn().mockResolvedValue(undefined),
  }),
  buyerPush: stub({
    notifyDelivered: jest.fn().mockResolvedValue(undefined),
    notifyOutForDelivery: jest.fn().mockResolvedValue(undefined),
  }),
};
