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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let AuditService = AuditService_1 = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async log(entry) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    actorId: entry.actorId,
                    action: entry.action,
                    resourceType: entry.resourceType,
                    resourceId: entry.resourceId,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                    metadata: entry.metadata ?? client_1.Prisma.JsonNull,
                },
            });
        }
        catch (err) {
            this.logger.error({ err, action: entry.action, actorId: entry.actorId }, 'Failed to write audit log');
        }
    }
    async logBatch(entries) {
        try {
            await this.prisma.auditLog.createMany({
                data: entries.map((e) => ({
                    actorId: e.actorId,
                    action: e.action,
                    resourceType: e.resourceType,
                    resourceId: e.resourceId,
                    ipAddress: e.ipAddress,
                    userAgent: e.userAgent,
                    metadata: e.metadata ?? client_1.Prisma.JsonNull,
                })),
                skipDuplicates: false,
            });
        }
        catch (err) {
            this.logger.error({ err }, 'Failed to write audit log batch');
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map