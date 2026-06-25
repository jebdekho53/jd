import { Injectable } from '@nestjs/common';
import type { PlatformDailyMetrics, SalesPoint } from './analytics-metrics.types';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type ExportRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

@Injectable()
export class AnalyticsExportService {
  exportExecutive(metrics: PlatformDailyMetrics[], format: ExportFormat): { content: string; mime: string; filename: string } {
    const rows = [
      ['date', 'gmv', 'orders', 'revenue', 'activeBuyers', 'aov', 'refundRate', 'walletLiability', 'rewardLiability'],
      ...metrics.map((m, i) => [
        `day-${i + 1}`,
        m.executive.gmv,
        m.executive.orders,
        m.executive.revenue,
        m.executive.activeBuyers,
        m.executive.aov,
        m.executive.refundRate,
        m.executive.walletLiability,
        m.executive.rewardLiability,
      ]),
    ];
    return this.asCsv('executive', rows, format);
  }

  exportSales(series: SalesPoint[], format: ExportFormat) {
    const rows = [['label', 'orders', 'gmv', 'revenue'], ...series.map((s) => [s.label, s.orders, s.gmv, s.revenue])];
    return this.asCsv('sales', rows, format);
  }

  private asCsv(name: string, rows: (string | number)[][], format: ExportFormat) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    if (format === 'csv') {
      return { content: csv, mime: 'text/csv', filename: `${name}.csv` };
    }
    if (format === 'xlsx') {
      return { content: csv, mime: 'application/vnd.ms-excel', filename: `${name}.xlsx` };
    }
    const pdf = `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n${csv}`;
    return { content: pdf, mime: 'application/pdf', filename: `${name}.pdf` };
  }
}
