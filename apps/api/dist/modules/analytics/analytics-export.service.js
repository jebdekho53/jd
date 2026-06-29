"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsExportService = void 0;
const common_1 = require("@nestjs/common");
let AnalyticsExportService = class AnalyticsExportService {
    exportExecutive(metrics, format) {
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
    exportSales(series, format) {
        const rows = [['label', 'orders', 'gmv', 'revenue'], ...series.map((s) => [s.label, s.orders, s.gmv, s.revenue])];
        return this.asCsv('sales', rows, format);
    }
    asCsv(name, rows, format) {
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
};
exports.AnalyticsExportService = AnalyticsExportService;
exports.AnalyticsExportService = AnalyticsExportService = __decorate([
    (0, common_1.Injectable)()
], AnalyticsExportService);
//# sourceMappingURL=analytics-export.service.js.map