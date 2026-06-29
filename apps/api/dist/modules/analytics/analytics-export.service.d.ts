import type { PlatformDailyMetrics, SalesPoint } from './analytics-metrics.types';
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type ExportRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';
export declare class AnalyticsExportService {
    exportExecutive(metrics: PlatformDailyMetrics[], format: ExportFormat): {
        content: string;
        mime: string;
        filename: string;
    };
    exportSales(series: SalesPoint[], format: ExportFormat): {
        content: string;
        mime: string;
        filename: string;
    };
    private asCsv;
}
