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
exports.FraudCaseService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let FraudCaseService = class FraudCaseService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async openCase(input) {
        const existing = await this.prisma.fraudCase.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing)
            return existing;
        const count = await this.prisma.fraudCase.count();
        const caseNumber = `JD-FRD-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count + 1).padStart(6, '0')}`;
        return this.prisma.fraudCase.create({
            data: {
                caseNumber,
                userId: input.userId,
                category: input.category,
                severity: input.severity,
                title: input.title,
                description: input.description,
                subjectType: input.subjectType,
                subjectId: input.subjectId,
                idempotencyKey: input.idempotencyKey,
            },
        });
    }
    async recordDecision(input) {
        const existing = await this.prisma.fraudDecision.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing)
            return existing;
        return this.prisma.fraudDecision.create({
            data: {
                fraudCaseId: input.fraudCaseId,
                fraudRuleId: input.fraudRuleId,
                userId: input.userId,
                decision: input.decision,
                actionTaken: input.actionTaken ?? false,
                idempotencyKey: input.idempotencyKey,
                metadata: input.metadata,
            },
        });
    }
    async listCases(category, status, page = 1, limit = 20) {
        const where = {};
        if (category)
            where.category = category;
        if (status)
            where.status = status;
        const [items, total] = await Promise.all([
            this.prisma.fraudCase.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.fraudCase.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async resolveCase(caseId, adminUserId, resolution, dismiss = false) {
        return this.prisma.fraudCase.update({
            where: { id: caseId },
            data: {
                status: dismiss ? client_1.FraudCaseStatus.DISMISSED : client_1.FraudCaseStatus.RESOLVED,
                resolvedAt: new Date(),
                resolvedBy: adminUserId,
                resolution,
            },
        });
    }
};
exports.FraudCaseService = FraudCaseService;
exports.FraudCaseService = FraudCaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FraudCaseService);
//# sourceMappingURL=fraud-case.service.js.map