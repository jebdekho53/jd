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
exports.MarketingEventService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let MarketingEventService = class MarketingEventService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async track(input) {
        const event = await this.prisma.marketingEvent.create({
            data: {
                userId: input.userId,
                eventType: input.eventType,
                sessionId: input.sessionId,
                storeId: input.storeId,
                productId: input.productId,
                orderId: input.orderId,
                metadata: input.metadata,
            },
        });
        if (input.userId) {
            void this.updateAffinities(input);
        }
        return event;
    }
    async updateAffinities(input) {
        if (!input.userId)
            return;
        const scoreBump = 1;
        if (input.productId) {
            await this.prisma.customerAffinity.upsert({
                where: {
                    userId_affinityType_entityType_entityId: {
                        userId: input.userId,
                        affinityType: 'PRODUCT',
                        entityType: 'product',
                        entityId: input.productId,
                    },
                },
                create: {
                    userId: input.userId,
                    affinityType: 'PRODUCT',
                    entityType: 'product',
                    entityId: input.productId,
                    score: scoreBump,
                },
                update: { score: { increment: scoreBump } },
            });
        }
        if (input.storeId) {
            await this.prisma.customerAffinity.upsert({
                where: {
                    userId_affinityType_entityType_entityId: {
                        userId: input.userId,
                        affinityType: 'STORE',
                        entityType: 'store',
                        entityId: input.storeId,
                    },
                },
                create: {
                    userId: input.userId,
                    affinityType: 'STORE',
                    entityType: 'store',
                    entityId: input.storeId,
                    score: scoreBump,
                },
                update: { score: { increment: scoreBump } },
            });
        }
    }
};
exports.MarketingEventService = MarketingEventService;
exports.MarketingEventService = MarketingEventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketingEventService);
//# sourceMappingURL=marketing-event.service.js.map