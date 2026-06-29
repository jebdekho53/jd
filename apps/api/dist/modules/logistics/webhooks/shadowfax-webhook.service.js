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
var ShadowfaxWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowfaxWebhookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../database/prisma.service");
const delivery_orchestrator_service_1 = require("../delivery-orchestrator.service");
const shadowfax_status_mapper_1 = require("../mappers/shadowfax-status.mapper");
const mask_sensitive_util_1 = require("../utils/mask-sensitive.util");
const logistics_constants_1 = require("../logistics.constants");
const event_emitter_1 = require("@nestjs/event-emitter");
let ShadowfaxWebhookService = ShadowfaxWebhookService_1 = class ShadowfaxWebhookService {
    constructor(prisma, orchestrator, events, config) {
        this.prisma = prisma;
        this.orchestrator = orchestrator;
        this.events = events;
        this.logger = new common_1.Logger(ShadowfaxWebhookService_1.name);
        this.webhookSecret = config.get('SHADOWFAX_WEBHOOK_SECRET', '') ?? '';
    }
    verifySignature(rawBody, signature) {
        if (!this.webhookSecret) {
            if (process.env.ALLOW_INSECURE_WEBHOOKS === 'true' && process.env.NODE_ENV !== 'production') {
                return;
            }
            throw new common_1.UnauthorizedException('Webhook secret not configured');
        }
        if (!signature) {
            throw new common_1.UnauthorizedException('Missing webhook signature');
        }
        const expected = (0, crypto_1.createHmac)('sha256', this.webhookSecret).update(rawBody).digest('hex');
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !(0, crypto_1.timingSafeEqual)(sigBuf, expBuf)) {
            throw new common_1.UnauthorizedException('Invalid webhook signature');
        }
    }
    matchesAuthorizationToken(authorization) {
        if (!this.webhookSecret || !authorization?.trim())
            return false;
        const token = authorization.replace(/^(Bearer|Token)\s+/i, '').trim();
        if (!token)
            return false;
        const a = Buffer.from(token);
        const b = Buffer.from(this.webhookSecret);
        if (a.length !== b.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(a, b);
    }
    verifyWebhookAuth(rawBody, signature, authorization) {
        if (!this.webhookSecret) {
            if (process.env.ALLOW_INSECURE_WEBHOOKS === 'true' && process.env.NODE_ENV !== 'production') {
                return;
            }
            throw new common_1.UnauthorizedException('Webhook secret not configured');
        }
        if (signature) {
            try {
                this.verifySignature(rawBody, signature);
                return;
            }
            catch {
            }
        }
        if (this.matchesAuthorizationToken(authorization)) {
            return;
        }
        if (!signature && !authorization?.trim()) {
            throw new common_1.UnauthorizedException('Missing webhook authentication');
        }
        throw new common_1.UnauthorizedException('Invalid webhook authentication');
    }
    async handlePayload(rawBody, signature, authorization) {
        this.verifyWebhookAuth(rawBody, signature, authorization);
        let payload;
        try {
            payload = JSON.parse(rawBody.toString('utf8'));
        }
        catch {
            throw new common_1.BadRequestException('Invalid JSON payload');
        }
        const eventId = (typeof payload.event_id === 'string' && payload.event_id) ||
            (typeof payload.id === 'string' && payload.id) ||
            null;
        const provider = await this.prisma.deliveryProvider.upsert({
            where: { type: client_1.DeliveryProviderType.SHADOWFAX },
            create: { type: client_1.DeliveryProviderType.SHADOWFAX, name: 'Shadowfax', isActive: true, isPrimary: true },
            update: {},
        });
        if (eventId) {
            const dup = await this.prisma.providerWebhook.findUnique({
                where: {
                    providerType_eventId: {
                        providerType: client_1.DeliveryProviderType.SHADOWFAX,
                        eventId,
                    },
                },
            });
            if (dup) {
                this.logger.debug({ eventId }, 'Duplicate Shadowfax webhook ignored');
                return;
            }
        }
        const webhook = await this.prisma.providerWebhook.create({
            data: {
                providerId: provider.id,
                providerType: client_1.DeliveryProviderType.SHADOWFAX,
                eventId,
                payload: (0, mask_sensitive_util_1.maskSensitivePayload)(payload),
                signature,
                status: client_1.ProviderWebhookStatus.RECEIVED,
            },
        });
        this.logger.log({ webhookId: webhook.id, eventId, payload: (0, mask_sensitive_util_1.maskSensitivePayload)(payload) }, 'Shadowfax webhook received');
        this.events.emit(logistics_constants_1.LOGISTICS_EVENTS.WEBHOOK_RECEIVED, { webhookId: webhook.id, providerType: 'SHADOWFAX' });
        try {
            await this.processShadowfaxEvent(payload);
            await this.prisma.providerWebhook.update({
                where: { id: webhook.id },
                data: { status: client_1.ProviderWebhookStatus.PROCESSED, processedAt: new Date() },
            });
        }
        catch (err) {
            await this.prisma.providerWebhook.update({
                where: { id: webhook.id },
                data: {
                    status: client_1.ProviderWebhookStatus.FAILED,
                    errorMessage: err instanceof Error ? err.message : 'Processing failed',
                    processedAt: new Date(),
                },
            });
            throw err;
        }
    }
    async processShadowfaxEvent(payload) {
        const data = (payload.data && typeof payload.data === 'object'
            ? payload.data
            : payload);
        const externalId = (typeof data.shipment_id === 'string' && data.shipment_id) ||
            (typeof data.awb_number === 'string' && data.awb_number) ||
            (typeof data.client_order_id === 'string' && data.client_order_id) ||
            null;
        if (!externalId) {
            throw new common_1.BadRequestException('Webhook missing shipment identifier');
        }
        const shipment = await this.prisma.providerShipment.findFirst({
            where: {
                OR: [
                    { externalShipmentId: externalId },
                    { trackingNumber: externalId },
                    { order: { orderNumber: externalId } },
                ],
            },
        });
        if (!shipment) {
            this.logger.warn({ externalId }, 'Shadowfax webhook for unknown shipment');
            return;
        }
        const providerStatus = (typeof data.status === 'string' && data.status) ||
            (typeof payload.event === 'string' && payload.event) ||
            'pending';
        const normalized = (0, shadowfax_status_mapper_1.mapShadowfaxStatus)(providerStatus);
        const rider = data.rider && typeof data.rider === 'object' ? data.rider : {};
        await this.orchestrator.applyStatusUpdate(shipment.id, providerStatus, normalized, {
            driverName: (typeof data.rider_name === 'string' && data.rider_name) ||
                (typeof rider.name === 'string' && rider.name) ||
                undefined,
            driverPhone: (typeof data.rider_phone === 'string' && data.rider_phone) ||
                (typeof rider.phone === 'string' && rider.phone) ||
                undefined,
            vehicleType: (typeof data.vehicle_type === 'string' && data.vehicle_type) ||
                (typeof rider.vehicle_type === 'string' && rider.vehicle_type) ||
                undefined,
            lat: typeof data.latitude === 'number' ? data.latitude : undefined,
            lng: typeof data.longitude === 'number' ? data.longitude : undefined,
            podUrl: typeof data.pod_url === 'string' ? data.pod_url : undefined,
            rawPayload: payload,
        });
        if (normalized === client_1.ShipmentProviderStatus.DELIVERED && typeof data.pod_url === 'string') {
            await this.prisma.providerShipment.update({
                where: { id: shipment.id },
                data: { podUrl: data.pod_url },
            });
        }
    }
};
exports.ShadowfaxWebhookService = ShadowfaxWebhookService;
exports.ShadowfaxWebhookService = ShadowfaxWebhookService = ShadowfaxWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        delivery_orchestrator_service_1.DeliveryOrchestratorService,
        event_emitter_1.EventEmitter2,
        config_1.ConfigService])
], ShadowfaxWebhookService);
//# sourceMappingURL=shadowfax-webhook.service.js.map