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
var WebhookDedupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookDedupService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let WebhookDedupService = WebhookDedupService_1 = class WebhookDedupService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhookDedupService_1.name);
    }
    hashPayload(rawBody) {
        return (0, crypto_1.createHash)('sha256').update(rawBody).digest('hex');
    }
    async claimEvent(provider, eventId, rawBody, signature) {
        const payloadHash = this.hashPayload(rawBody);
        const resolvedEventId = eventId?.trim() || `${payloadHash.slice(0, 32)}`;
        try {
            const record = await this.prisma.webhookEvent.create({
                data: {
                    provider,
                    eventId: resolvedEventId,
                    signature,
                    payloadHash,
                    status: client_1.WebhookEventStatus.RECEIVED,
                },
            });
            return { action: 'process', recordId: record.id };
        }
        catch (err) {
            const code = err?.code;
            if (code !== 'P2002')
                throw err;
            const existing = await this.prisma.webhookEvent.findUnique({
                where: { provider_eventId: { provider, eventId: resolvedEventId } },
            });
            if (!existing)
                return { action: 'duplicate' };
            if (existing.status === client_1.WebhookEventStatus.FAILED ||
                existing.status === client_1.WebhookEventStatus.RECEIVED) {
                await this.prisma.webhookEvent.update({
                    where: { id: existing.id },
                    data: { status: client_1.WebhookEventStatus.RECEIVED, errorMessage: null },
                });
                return { action: 'retry', recordId: existing.id };
            }
            this.logger.debug({ provider, eventId: resolvedEventId }, 'Duplicate webhook ignored');
            return { action: 'duplicate' };
        }
    }
    async markProcessed(recordId) {
        await this.prisma.webhookEvent.update({
            where: { id: recordId },
            data: { status: client_1.WebhookEventStatus.PROCESSED, processedAt: new Date() },
        });
    }
    async markFailed(recordId, error) {
        await this.prisma.webhookEvent.update({
            where: { id: recordId },
            data: {
                status: client_1.WebhookEventStatus.FAILED,
                errorMessage: error.slice(0, 2000),
                processedAt: new Date(),
            },
        });
    }
    async markDuplicate(recordId) {
        await this.prisma.webhookEvent.update({
            where: { id: recordId },
            data: { status: client_1.WebhookEventStatus.DUPLICATE, processedAt: new Date() },
        });
    }
};
exports.WebhookDedupService = WebhookDedupService;
exports.WebhookDedupService = WebhookDedupService = WebhookDedupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhookDedupService);
//# sourceMappingURL=webhook-dedup.service.js.map