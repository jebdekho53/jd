export declare const BUYER_STATUS_GROUPS: {
    readonly active: ["PAYMENT_PENDING", "PAID", "CREATED", "MERCHANT_ACCEPTED", "PREPARING", "PACKING", "READY_FOR_PICKUP", "RIDER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"];
    readonly cancelled: ["CANCELLED_BY_BUYER", "CANCELLED_BY_MERCHANT", "CANCELLED_BY_ADMIN", "PAYMENT_FAILED", "DELIVERY_FAILED"];
    readonly completed: ["DELIVERED", "COMPLETED", "REFUNDED"];
};
export declare const MERCHANT_STATUS_GROUPS: {
    readonly active: ("RIDER_ASSIGNED" | "PAID" | "MERCHANT_ACCEPTED" | "PREPARING" | "PACKING" | "READY_FOR_PICKUP" | "PICKED_UP" | "OUT_FOR_DELIVERY")[];
    readonly new: ["PAID", "MERCHANT_ACCEPTED"];
    readonly accepted: ["MERCHANT_ACCEPTED"];
    readonly preparing: ["PREPARING"];
    readonly packing: ["PACKING"];
    readonly ready_for_pickup: ["READY_FOR_PICKUP"];
    readonly rider_assigned: ["RIDER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"];
    readonly delivered: ["DELIVERED", "COMPLETED"];
    readonly cancelled: ["CANCELLED_BY_BUYER", "CANCELLED_BY_MERCHANT", "CANCELLED_BY_ADMIN", "PAYMENT_FAILED", "DELIVERY_FAILED"];
};
export type BuyerStatusGroup = keyof typeof BUYER_STATUS_GROUPS;
export type MerchantStatusGroup = keyof typeof MERCHANT_STATUS_GROUPS;
