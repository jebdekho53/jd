"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsSnapshotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
let AnalyticsSnapshotService = class AnalyticsSnapshotService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsertDaily(scope, scopeId, snapshotDate, metrics) {
        const dateOnly = (0, ist_day_util_1.startOfIstDay)(snapshotDate);
        const json = metrics;
        const existing = await this.prisma.analyticsDailySnapshot.findFirst({
            where: { scope, scopeId, snapshotDate: dateOnly },
        });
        if (existing) {
            return this.prisma.analyticsDailySnapshot.update({
                where: { id: existing.id },
                data: { metrics: json },
            });
        }
        return this.prisma.analyticsDailySnapshot.create({
            data: { scope, scopeId, snapshotDate: dateOnly, metrics: json },
        });
    }
    async upsertHourly(scope, scopeId, bucketAt, metrics) {
        const bucket = (0, ist_day_util_1.istHourRange)(bucketAt).start;
        const json = metrics;
        const existing = await this.prisma.analyticsHourlySnapshot.findFirst({
            where: { scope, scopeId, bucketAt: bucket },
        });
        if (existing) {
            return this.prisma.analyticsHourlySnapshot.update({
                where: { id: existing.id },
                data: { metrics: json },
            });
        }
        return this.prisma.analyticsHourlySnapshot.create({
            data: { scope, scopeId, bucketAt: bucket, metrics: json },
        });
    }
    async getDaily(scope, scopeId, snapshotDate) {
        const dateOnly = (0, ist_day_util_1.startOfIstDay)(snapshotDate);
        return this.prisma.analyticsDailySnapshot.findFirst({
            where: { scope, scopeId, snapshotDate: dateOnly },
        });
    }
    async listDaily(scope, scopeId, from, to) {
        const fromDate = (0, ist_day_util_1.startOfIstDay)(from);
        const toDate = (0, ist_day_util_1.startOfIstDay)(to);
        return this.prisma.analyticsDailySnapshot.findMany({
            where: {
                scope,
                scopeId: scopeId ?? null,
                snapshotDate: { gte: fromDate, lte: toDate },
            },
            orderBy: { snapshotDate: 'asc' },
        });
    }
    async listHourly(scope, scopeId, from, to) {
        return this.prisma.analyticsHourlySnapshot.findMany({
            where: {
                scope,
                scopeId: scopeId ?? null,
                bucketAt: { gte: from, lte: to },
            },
            orderBy: { bucketAt: 'asc' },
        });
    }
};
exports.AnalyticsSnapshotService = AnalyticsSnapshotService;
exports.AnalyticsSnapshotService = AnalyticsSnapshotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsSnapshotService);
//# sourceMappingURL=analytics-snapshot.service.js.map