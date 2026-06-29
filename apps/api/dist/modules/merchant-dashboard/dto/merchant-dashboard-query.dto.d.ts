export declare class MerchantDashboardStoreQueryDto {
    storeId?: string;
}
export declare class MerchantDashboardOrdersQueryDto extends MerchantDashboardStoreQueryDto {
    tab?: string;
    page?: number;
    limit?: number;
}
export declare class MerchantDashboardAnalyticsQueryDto extends MerchantDashboardStoreQueryDto {
    period?: '7d' | '30d';
}
