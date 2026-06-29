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
var ReservationCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationCleanupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
let ReservationCleanupService = ReservationCleanupService_1 = class ReservationCleanupService {
    constructor(prisma, audit, domainEvents) {
        this.prisma = prisma;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.logger = new common_1.Logger(ReservationCleanupService_1.name);
    }
    async releaseExpiredReservations() {
        const now = new Date();
        const expired = await this.prisma.inventoryReservation.findMany({
            where: { status: client_1.ReservationStatus.ACTIVE, expiresAt: { lt: now } },
            select: { id: true, checkoutId: true, variantId: true, quantity: true },
        });
        if (expired.length === 0)
            return;
        this.logger.log(`Releasing ${expired.length} expired reservation(s)`);
        for (const res of expired) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    const current = await tx.inventoryReservation.findUnique({
                        where: { id: res.id },
                        select: { status: true },
                    });
                    if (!current || current.status !== client_1.ReservationStatus.ACTIVE)
                        return;
                    await tx.inventory.update({
                        where: { variantId: res.variantId },
                        data: {
                            availableQty: { increment: res.quantity },
                            reservedQty: { decrement: res.quantity },
                            version: { increment: 1 },
                        },
                    });
                    await tx.inventoryReservation.update({
                        where: { id: res.id },
                        data: { status: client_1.ReservationStatus.EXPIRED },
                    });
                });
            }
            catch (err) {
                this.logger.error(`Failed to release reservation ${res.id}: ${err.message}`);
            }
        }
        const expiredCheckouts = await this.prisma.checkout.updateMany({
            where: { status: client_1.CheckoutStatus.RESERVED, expiresAt: { lt: now } },
            data: { status: client_1.CheckoutStatus.EXPIRED },
        });
        if (expiredCheckouts.count > 0) {
            this.logger.log(`Expired ${expiredCheckouts.count} checkout(s)`);
            void this.domainEvents.emit(client_1.DomainEventType.INVENTORY_RELEASED, 'checkout', 'batch', { releasedReservations: expired.length, expiredCheckouts: expiredCheckouts.count }, { userId: 'system', ipAddress: null });
        }
        await this.prisma.idempotencyKey.deleteMany({
            where: { expiresAt: { lt: now } },
        });
    }
};
exports.ReservationCleanupService = ReservationCleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReservationCleanupService.prototype, "releaseExpiredReservations", null);
exports.ReservationCleanupService = ReservationCleanupService = ReservationCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService])
], ReservationCleanupService);
//# sourceMappingURL=reservation-cleanup.service.js.map