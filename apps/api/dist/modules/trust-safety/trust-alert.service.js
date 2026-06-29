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
var TrustAlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustAlertService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let TrustAlertService = TrustAlertService_1 = class TrustAlertService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TrustAlertService_1.name);
    }
    async raise(alertType, severity, title, message, metadata) {
        const recent = await this.prisma.trustAlert.findFirst({
            where: {
                alertType,
                status: 'OPEN',
                createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
            },
        });
        if (recent)
            return recent;
        return this.prisma.trustAlert.create({
            data: {
                alertType,
                severity,
                title,
                message,
                metadata: metadata,
            },
        });
    }
    async listOpen(limit = 50) {
        return this.prisma.trustAlert.findMany({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async resolve(id) {
        return this.prisma.trustAlert.update({
            where: { id },
            data: { status: 'RESOLVED', resolvedAt: new Date() },
        });
    }
    async checkFraudSpike() {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const count = await this.prisma.fraudCase.count({
            where: { createdAt: { gte: hourAgo }, status: 'OPEN' },
        });
        if (count >= 10) {
            await this.raise(client_1.TrustAlertType.FRAUD_SPIKE, 'CRITICAL', 'Fraud case spike', `${count} new fraud cases in the last hour.`, { count });
        }
    }
};
exports.TrustAlertService = TrustAlertService;
exports.TrustAlertService = TrustAlertService = TrustAlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrustAlertService);
//# sourceMappingURL=trust-alert.service.js.map