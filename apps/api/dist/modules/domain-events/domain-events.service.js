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
var DomainEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEventsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let DomainEventsService = DomainEventsService_1 = class DomainEventsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DomainEventsService_1.name);
    }
    async emit(eventType, aggregateType, aggregateId, payload, metadata) {
        try {
            const event = await this.prisma.domainEvent.create({
                data: {
                    eventType,
                    aggregateType,
                    aggregateId,
                    payload: payload ?? client_1.Prisma.JsonNull,
                    metadata: metadata ?? client_1.Prisma.JsonNull,
                },
                select: { id: true },
            });
            this.logger.debug({ eventType, aggregateType, aggregateId, eventId: event.id }, 'Domain event emitted');
            return event.id;
        }
        catch (err) {
            this.logger.error({ err, eventType, aggregateType, aggregateId }, 'Failed to persist domain event');
            return '';
        }
    }
    async markProcessed(eventId) {
        await this.prisma.domainEvent.update({
            where: { id: eventId },
            data: { processedAt: new Date() },
        });
    }
    async getUnprocessed(eventType, limit = 100) {
        return this.prisma.domainEvent.findMany({
            where: { eventType, processedAt: null },
            orderBy: { occurredAt: 'asc' },
            take: limit,
            select: { id: true, aggregateId: true, payload: true },
        });
    }
};
exports.DomainEventsService = DomainEventsService;
exports.DomainEventsService = DomainEventsService = DomainEventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DomainEventsService);
//# sourceMappingURL=domain-events.service.js.map