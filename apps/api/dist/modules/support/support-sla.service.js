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
exports.SupportSlaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let SupportSlaService = class SupportSlaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSla(priority) {
        return this.prisma.supportSla.findUnique({ where: { priority } });
    }
    async computeDeadlines(priority, from = new Date()) {
        const sla = await this.getSla(priority);
        if (!sla) {
            return {
                slaResponseDue: new Date(from.getTime() + 4 * 60 * 60 * 1000),
                slaResolutionDue: new Date(from.getTime() + 24 * 60 * 60 * 1000),
            };
        }
        return {
            slaResponseDue: new Date(from.getTime() + sla.responseMinutes * 60 * 1000),
            slaResolutionDue: new Date(from.getTime() + sla.resolutionMinutes * 60 * 1000),
        };
    }
    isResponseOverdue(ticket) {
        if (ticket.firstResponseAt || !ticket.slaResponseDue)
            return false;
        if (['RESOLVED', 'CLOSED'].includes(ticket.status))
            return false;
        return new Date() > ticket.slaResponseDue;
    }
    isResolutionOverdue(ticket) {
        if (ticket.resolvedAt || !ticket.slaResolutionDue)
            return false;
        if (['RESOLVED', 'CLOSED'].includes(ticket.status))
            return false;
        return new Date() > ticket.slaResolutionDue;
    }
};
exports.SupportSlaService = SupportSlaService;
exports.SupportSlaService = SupportSlaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportSlaService);
//# sourceMappingURL=support-sla.service.js.map