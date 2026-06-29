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
exports.SupportTicketService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const support_sla_service_1 = require("./support-sla.service");
const ticket_assignment_service_1 = require("./ticket-assignment.service");
const support_automation_service_1 = require("./support-automation.service");
const membership_benefit_service_1 = require("../membership/membership-benefit.service");
const email_notification_service_1 = require("../email/email-notification.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const buyer_push_events_1 = require("../push/buyer-push.events");
let SupportTicketService = class SupportTicketService {
    constructor(prisma, audit, sla, assignment, automation, membershipBenefits, emailNotifications, events) {
        this.prisma = prisma;
        this.audit = audit;
        this.sla = sla;
        this.assignment = assignment;
        this.automation = automation;
        this.membershipBenefits = membershipBenefits;
        this.emailNotifications = emailNotifications;
        this.events = events;
    }
    async createTicket(input, ipAddress) {
        const category = await this.prisma.supportCategory.findUnique({
            where: { code: input.categoryCode },
        });
        if (!category || !category.isActive) {
            throw new common_1.BadRequestException('Invalid support category');
        }
        let priority = input.priority ?? this.inferPriority(input.categoryCode);
        if (await this.membershipBenefits.isVipSupport(input.requesterUserId)) {
            priority = client_1.SupportPriority.HIGH;
        }
        const team = this.assignment.resolveTeam(category.code, input.actorType);
        const deadlines = await this.sla.computeDeadlines(priority);
        const ticketNumber = await this.nextTicketNumber();
        const isRefundDispute = ['REFUND_ISSUE', 'ORDER_DISPUTE'].includes(category.code);
        const ticket = await this.prisma.supportTicket.create({
            data: {
                ticketNumber,
                requesterUserId: input.requesterUserId,
                actorType: input.actorType,
                channel: input.channel ?? 'IN_APP',
                categoryId: category.id,
                priority,
                subject: input.subject,
                description: input.description,
                orderId: input.orderId,
                paymentId: input.paymentId,
                walletTransactionId: input.walletTransactionId,
                gstInvoiceId: input.gstInvoiceId,
                isRefundDispute,
                assignedTeam: team,
                ...deadlines,
                messages: {
                    create: {
                        authorId: input.requesterUserId,
                        body: input.description,
                        visibility: client_1.SupportMessageVisibility.PUBLIC,
                    },
                },
            },
            include: { category: true },
        });
        await this.assignment.assignTicket(ticket.id, team);
        await this.automation.autoTagTicket(ticket.id, category.code, input.orderId);
        void this.audit.log({
            actorId: input.requesterUserId,
            action: 'SUPPORT_TICKET_CREATED',
            resourceType: 'support_ticket',
            resourceId: ticket.id,
            ipAddress,
            metadata: { ticketNumber, category: category.code },
        });
        void this.emailNotifications.sendSupportTicketCreated(ticket.id).catch(() => { });
        return ticket;
    }
    async listTicketsForUser(userId, page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where: { requesterUserId: userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { category: true, feedback: true },
            }),
            this.prisma.supportTicket.count({ where: { requesterUserId: userId } }),
        ]);
        return { items, total, page, limit };
    }
    async getTicketForUser(ticketId, userId, isStaff = false) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                category: true,
                messages: {
                    where: isStaff ? undefined : { visibility: client_1.SupportMessageVisibility.PUBLIC },
                    orderBy: { createdAt: 'asc' },
                },
                attachments: true,
                assignments: { where: { isActive: true }, include: { agent: { include: { user: { select: { phone: true } } } } } },
                resolution: true,
                feedback: true,
                tags: { include: { tag: true } },
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        if (!isStaff && ticket.requesterUserId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return ticket;
    }
    async reply(ticketId, authorId, body, visibility = client_1.SupportMessageVisibility.PUBLIC, isStaff = false) {
        const ticket = await this.getTicketForUser(ticketId, authorId, isStaff);
        if (['CLOSED'].includes(ticket.status)) {
            throw new common_1.BadRequestException('Ticket is closed');
        }
        const message = await this.prisma.supportMessage.create({
            data: { ticketId, authorId, body, visibility },
        });
        const updates = {
            status: isStaff ? client_1.SupportTicketStatus.WAITING_CUSTOMER : client_1.SupportTicketStatus.IN_PROGRESS,
        };
        if (isStaff && !ticket.firstResponseAt) {
            updates.firstResponseAt = new Date();
        }
        await this.prisma.supportTicket.update({ where: { id: ticketId }, data: updates });
        void this.audit.log({
            actorId: authorId,
            action: visibility === client_1.SupportMessageVisibility.INTERNAL ? 'SUPPORT_INTERNAL_NOTE' : 'SUPPORT_TICKET_REPLY',
            resourceType: 'support_ticket',
            resourceId: ticketId,
        });
        if (isStaff && visibility === client_1.SupportMessageVisibility.PUBLIC) {
            this.events.emit(buyer_push_events_1.BUYER_PUSH_EVENTS.SUPPORT_REPLY, {
                userId: ticket.requesterUserId,
                ticketId,
                ticketNumber: ticket.ticketNumber,
            });
        }
        return message;
    }
    async addAttachment(ticketId, userId, file, messageId) {
        await this.getTicketForUser(ticketId, userId);
        return this.prisma.supportAttachment.create({
            data: { ticketId, messageId, ...file },
        });
    }
    async submitFeedback(ticketId, userId, rating, comment) {
        if (rating < 1 || rating > 5)
            throw new common_1.BadRequestException('Rating must be 1-5');
        const ticket = await this.getTicketForUser(ticketId, userId);
        if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
            throw new common_1.BadRequestException('Ticket must be resolved before feedback');
        }
        return this.prisma.supportFeedback.upsert({
            where: { ticketId },
            create: { ticketId, rating, comment },
            update: { rating, comment },
        });
    }
    async resolveTicket(ticketId, agentUserId, summary, refundApproved) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        await this.prisma.$transaction([
            this.prisma.supportResolution.upsert({
                where: { ticketId },
                create: { ticketId, resolvedBy: agentUserId, summary, refundApproved },
                update: { summary, refundApproved, resolvedBy: agentUserId },
            }),
            this.prisma.supportTicket.update({
                where: { id: ticketId },
                data: { status: client_1.SupportTicketStatus.RESOLVED, resolvedAt: new Date() },
            }),
        ]);
        void this.audit.log({
            actorId: agentUserId,
            action: 'SUPPORT_TICKET_RESOLVED',
            resourceType: 'support_ticket',
            resourceId: ticketId,
            metadata: { refundApproved },
        });
        return { ticketId, status: client_1.SupportTicketStatus.RESOLVED };
    }
    inferPriority(categoryCode) {
        if (['REFUND_ISSUE', 'PAYMENT_PROBLEM', 'COD_MISMATCH'].includes(categoryCode)) {
            return client_1.SupportPriority.HIGH;
        }
        if (['DELIVERY_PROBLEM', 'ORDER_ISSUE'].includes(categoryCode)) {
            return client_1.SupportPriority.MEDIUM;
        }
        return client_1.SupportPriority.LOW;
    }
    async nextTicketNumber() {
        const now = new Date();
        const periodKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const seq = await this.prisma.$transaction(async (tx) => {
            const row = await tx.supportTicketSequence.upsert({
                where: { periodKey },
                create: { periodKey, lastSequence: 1 },
                update: { lastSequence: { increment: 1 } },
            });
            return row.lastSequence;
        });
        return `JD-TKT-${periodKey}-${String(seq).padStart(6, '0')}`;
    }
};
exports.SupportTicketService = SupportTicketService;
exports.SupportTicketService = SupportTicketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        support_sla_service_1.SupportSlaService,
        ticket_assignment_service_1.TicketAssignmentService,
        support_automation_service_1.SupportAutomationService,
        membership_benefit_service_1.MembershipBenefitService,
        email_notification_service_1.EmailNotificationService,
        event_emitter_1.EventEmitter2])
], SupportTicketService);
//# sourceMappingURL=support-ticket.service.js.map