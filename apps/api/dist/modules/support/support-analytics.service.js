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
exports.SupportAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let SupportAnalyticsService = class SupportAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [created, resolved, open, feedback, resolvedTickets] = await Promise.all([
            this.prisma.supportTicket.count({ where: { createdAt: { gte: since } } }),
            this.prisma.supportTicket.count({
                where: { status: { in: [client_1.SupportTicketStatus.RESOLVED, client_1.SupportTicketStatus.CLOSED] }, createdAt: { gte: since } },
            }),
            this.prisma.supportTicket.count({
                where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING', 'WAITING_CUSTOMER', 'ESCALATED'] } },
            }),
            this.prisma.supportFeedback.findMany({
                where: { createdAt: { gte: since } },
                select: { rating: true },
            }),
            this.prisma.supportTicket.findMany({
                where: { resolvedAt: { not: null }, createdAt: { gte: since } },
                select: { createdAt: true, resolvedAt: true, firstResponseAt: true, slaResponseDue: true, slaResolutionDue: true },
                take: 500,
            }),
        ]);
        const avgResolutionHours = resolvedTickets.length > 0
            ? resolvedTickets.reduce((s, t) => {
                if (!t.resolvedAt)
                    return s;
                return s + (t.resolvedAt.getTime() - t.createdAt.getTime()) / 3600000;
            }, 0) / resolvedTickets.length
            : 0;
        const slaMet = resolvedTickets.filter((t) => t.resolvedAt && t.slaResolutionDue && t.resolvedAt <= t.slaResolutionDue).length;
        const slaPct = resolvedTickets.length ? Math.round((slaMet / resolvedTickets.length) * 100) : 100;
        const csat = feedback.length > 0
            ? Math.round((feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) * 20)
            : null;
        const agentPerf = await this.prisma.supportAssignment.groupBy({
            by: ['agentId'],
            where: { assignedAt: { gte: since }, isActive: false },
            _count: true,
        });
        return {
            ticketsCreated: created,
            ticketsResolved: resolved,
            ticketsOpen: open,
            averageResolutionHours: Math.round(avgResolutionHours * 10) / 10,
            slaCompliancePct: slaPct,
            csatScore: csat,
            agentAssignments: agentPerf.length,
        };
    }
    async listAdminTickets(filter) {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const where = {};
        if (filter.status)
            where.status = filter.status;
        if (filter.priority)
            where.priority = filter.priority;
        if (filter.team)
            where.assignedTeam = filter.team;
        if (filter.actorType)
            where.actorType = filter.actorType;
        if (filter.refundOnly)
            where.isRefundDispute = true;
        const [items, total] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    category: true,
                    requester: { select: { id: true, phone: true, email: true } },
                    assignments: { where: { isActive: true }, include: { agent: true } },
                    tags: { include: { tag: true } },
                },
            }),
            this.prisma.supportTicket.count({ where }),
        ]);
        return { items, total, page, limit };
    }
};
exports.SupportAnalyticsService = SupportAnalyticsService;
exports.SupportAnalyticsService = SupportAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportAnalyticsService);
//# sourceMappingURL=support-analytics.service.js.map