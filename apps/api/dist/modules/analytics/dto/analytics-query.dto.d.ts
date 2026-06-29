export declare class AnalyticsSalesQueryDto {
    granularity?: string;
    compare?: string;
}
export declare class AnalyticsExportQueryDto {
    format?: 'csv' | 'xlsx' | 'pdf';
    range?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';
    type?: string;
    from?: string;
    to?: string;
}
export declare class MerchantAnalyticsQueryDto {
    storeId: string;
    period?: '7d' | '30d';
}
