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
exports.TicketAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const CATEGORY_TEAM = {
    REFUND_ISSUE: client_1.SupportTeam.FINANCE,
    PAYMENT_PROBLEM: client_1.SupportTeam.FINANCE,
    SETTLEMENT_ISSUE: client_1.SupportTeam.FINANCE,
    PAYOUT_DELAY: client_1.SupportTeam.FINANCE,
    GST_ISSUE: client_1.SupportTeam.COMPLIANCE,
    COD_MISMATCH: client_1.SupportTeam.FINANCE,
    RIDER_EARNINGS: client_1.SupportTeam.RIDER_OPS,
    DELIVERY_DISPUTE: client_1.SupportTeam.RIDER_OPS,
    DELIVERY_PROBLEM: client_1.SupportTeam.RIDER_OPS,
    APP_ISSUE: client_1.SupportTeam.RIDER_OPS,
    RIDER_ACCOUNT: client_1.SupportTeam.RIDER_OPS,
    RIDER_KYC: client_1.SupportTeam.RIDER_OPS,
    INVENTORY_ISSUE: client_1.SupportTeam.MERCHANT_OPS,
    STORE_VERIFICATION: client_1.SupportTeam.MERCHANT_OPS,
    CAMPAIGN_PROBLEM: client_1.SupportTeam.MERCHANT_OPS,
    ORDER_DISPUTE: client_1.SupportTeam.MERCHANT_OPS,
};
let TicketAssignmentService = class TicketAssignmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    resolveTeam(categoryCode, actorType) {
        if (CATEGORY_TEAM[categoryCode])
            return CATEGORY_TEAM[categoryCode];
        if (actorType === client_1.SupportActorType.MERCHANT)
            return client_1.SupportTeam.MERCHANT_OPS;
        if (actorType === client_1.SupportActorType.RIDER)
            return client_1.SupportTeam.RIDER_OPS;
        return client_1.SupportTeam.CUSTOMER_SUPPORT;
    }
    async assignTicket(ticketId, team, assignedBy) {
        const agent = await this.prisma.supportAgent.findFirst({
            where: { team, isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        if (!agent) {
            await this.prisma.supportTicket.update({
                where: { id: ticketId },
                data: { assignedTeam: team },
            });
            return null;
        }
        await this.prisma.supportAssignment.updateMany({
            where: { ticketId, isActive: true },
            data: { isActive: false, unassignedAt: new Date() },
        });
        const assignment = await this.prisma.supportAssignment.create({
            data: {
                ticketId,
                agentId: agent.id,
                assignedBy,
                note: `Auto-assigned to ${team}`,
            },
        });
        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { assignedTeam: team, status: 'IN_PROGRESS' },
        });
        return assignment;
    }
};
exports.TicketAssignmentService = TicketAssignmentService;
exports.TicketAssignmentService = TicketAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketAssignmentService);
//# sourceMappingURL=ticket-assignment.service.js.map