export declare const BUYER_STATUS_GROUPS: {
    readonly active: [any, any, any, any, any, any, any, any, any, any];
    readonly cancelled: [any, any, any, any, any, any];
    readonly completed: [any, any, any];
};
export declare const MERCHANT_STATUS_GROUPS: {
    readonly active: any[];
    readonly new: [any, any];
    readonly accepted: [any];
    readonly preparing: [any];
    readonly packing: [any];
    readonly ready_for_pickup: [any];
    readonly rider_assigned: [any, any, any];
    readonly delivered: [any, any];
    readonly cancelled: [any, any, any, any, any];
};
export type BuyerStatusGroup = keyof typeof BUYER_STATUS_GROUPS;
export type MerchantStatusGroup = keyof typeof MERCHANT_STATUS_GROUPS;
