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
exports.CustomerTimelineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CustomerTimelineService = class CustomerTimelineService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTimeline(userId) {
        const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!buyer)
            return { events: [] };
        const [orders, walletTx, tickets, fraudCases, refunds] = await Promise.all([
            this.prisma.order.findMany({
                where: { buyerProfileId: buyer.id },
                orderBy: { createdAt: 'desc' },
                take: 15,
                select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
            }),
            this.prisma.walletTransaction.findMany({
                where: { wallet: { buyerProfileId: buyer.id } },
                orderBy: { createdAt: 'desc' },
                take: 15,
                select: { id: true, type: true, amount: true, description: true, createdAt: true },
            }),
            this.prisma.supportTicket.findMany({
                where: { requesterUserId: userId },
                orderBy: { createdAt: 'desc' },
                take: 15,
                select: { id: true, ticketNumber: true, subject: true, status: true, createdAt: true },
            }),
            this.prisma.fraudCase.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { id: true, caseNumber: true, title: true, status: true, createdAt: true },
            }),
            this.prisma.order.findMany({
                where: { buyerProfileId: buyer.id, status: 'REFUNDED' },
                orderBy: { updatedAt: 'desc' },
                take: 10,
                select: { id: true, orderNumber: true, totalAmount: true, updatedAt: true },
            }),
        ]);
        const events = [
            ...orders.map((o) => ({
                type: 'order',
                id: o.id,
                label: `Order #${o.orderNumber}`,
                detail: o.status,
                amount: Number(o.totalAmount),
                at: o.createdAt,
            })),
            ...walletTx.map((t) => ({
                type: 'wallet',
                id: t.id,
                label: t.type,
                detail: t.description ?? '',
                amount: Number(t.amount),
                at: t.createdAt,
            })),
            ...tickets.map((t) => ({
                type: 'support',
                id: t.id,
                label: t.ticketNumber,
                detail: t.subject,
                status: t.status,
                at: t.createdAt,
            })),
            ...fraudCases.map((f) => ({
                type: 'fraud',
                id: f.id,
                label: f.caseNumber,
                detail: f.title,
                status: f.status,
                at: f.createdAt,
            })),
            ...refunds.map((r) => ({
                type: 'refund',
                id: r.id,
                label: `Refund #${r.orderNumber}`,
                detail: 'REFUNDED',
                amount: Number(r.totalAmount),
                at: r.updatedAt,
            })),
        ].sort((a, b) => b.at.getTime() - a.at.getTime());
        return { events: events.slice(0, 40) };
    }
    async getTimelineForTicket(ticketId) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            select: { requesterUserId: true },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return this.getTimeline(ticket.requesterUserId);
    }
};
exports.CustomerTimelineService = CustomerTimelineService;
exports.CustomerTimelineService = CustomerTimelineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerTimelineService);
//# sourceMappingURL=customer-timeline.service.js.map