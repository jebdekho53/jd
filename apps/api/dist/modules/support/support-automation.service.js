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
var SupportAutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportAutomationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../database/prisma.service");
const ticket_assignment_service_1 = require("./ticket-assignment.service");
const support_sla_service_1 = require("./support-sla.service");
let SupportAutomationService = SupportAutomationService_1 = class SupportAutomationService {
    constructor(prisma, assignment, sla) {
        this.prisma = prisma;
        this.assignment = assignment;
        this.sla = sla;
        this.logger = new common_1.Logger(SupportAutomationService_1.name);
    }
    async autoTagTicket(ticketId, categoryCode, orderId) {
        const tags = [];
        if (['REFUND_ISSUE', 'ORDER_DISPUTE'].includes(categoryCode))
            tags.push('refund-related');
        if (['SETTLEMENT_ISSUE', 'PAYOUT_DELAY', 'GST_ISSUE', 'PAYMENT_PROBLEM'].includes(categoryCode)) {
            tags.push('finance-related');
        }
        if (orderId) {
            const fraudCase = await this.prisma.fraudCase.findFirst({
                where: { subjectType: 'order', subjectId: orderId, status: { in: ['OPEN', 'INVESTIGATING'] } },
            });
            if (fraudCase)
                tags.push('fraud-related');
        }
        for (const name of tags) {
            const tag = await this.prisma.supportTag.upsert({
                where: { name },
                create: { name },
                update: {},
            });
            await this.prisma.supportTicketTag.upsert({
                where: { ticketId_tagId: { ticketId, tagId: tag.id } },
                create: { ticketId, tagId: tag.id },
                update: {},
            });
        }
    }
    async escalateOverdueTickets() {
        const open = await this.prisma.supportTicket.findMany({
            where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING', 'WAITING_CUSTOMER'] } },
            take: 100,
        });
        for (const ticket of open) {
            if (!this.sla.isResolutionOverdue(ticket))
                continue;
            const nextPriority = this.bumpPriority(ticket.priority);
            if (nextPriority === ticket.priority)
                continue;
            await this.prisma.$transaction([
                this.prisma.supportEscalation.create({
                    data: {
                        ticketId: ticket.id,
                        fromPriority: ticket.priority,
                        toPriority: nextPriority,
                        reason: 'SLA resolution overdue — auto-escalated',
                    },
                }),
                this.prisma.supportTicket.update({
                    where: { id: ticket.id },
                    data: { priority: nextPriority, status: client_1.SupportTicketStatus.ESCALATED },
                }),
            ]);
            if (ticket.assignedTeam) {
                await this.assignment.assignTicket(ticket.id, ticket.assignedTeam);
            }
            const escalatedTag = await this.ensureTag('escalated');
            await this.prisma.supportTicketTag.upsert({
                where: { ticketId_tagId: { ticketId: ticket.id, tagId: escalatedTag.id } },
                create: { ticketId: ticket.id, tagId: escalatedTag.id },
                update: {},
            });
        }
    }
    async autoCloseResolvedTickets() {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await this.prisma.supportTicket.updateMany({
            where: {
                status: client_1.SupportTicketStatus.RESOLVED,
                resolvedAt: { lte: cutoff },
            },
            data: { status: client_1.SupportTicketStatus.CLOSED, closedAt: new Date() },
        });
        if (result.count > 0) {
            this.logger.log(`Auto-closed ${result.count} resolved tickets`);
        }
    }
    bumpPriority(p) {
        const order = [
            client_1.SupportPriority.LOW,
            client_1.SupportPriority.MEDIUM,
            client_1.SupportPriority.HIGH,
            client_1.SupportPriority.CRITICAL,
        ];
        const idx = order.indexOf(p);
        return order[Math.min(idx + 1, order.length - 1)];
    }
    async ensureTag(name) {
        return this.prisma.supportTag.upsert({
            where: { name },
            create: { name },
            update: {},
        });
    }
};
exports.SupportAutomationService = SupportAutomationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupportAutomationService.prototype, "escalateOverdueTickets", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupportAutomationService.prototype, "autoCloseResolvedTickets", null);
exports.SupportAutomationService = SupportAutomationService = SupportAutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ticket_assignment_service_1.TicketAssignmentService,
        support_sla_service_1.SupportSlaService])
], SupportAutomationService);
//# sourceMappingURL=support-automation.service.js.map