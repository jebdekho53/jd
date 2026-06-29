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
exports.RiderFraudDetectorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fraud_action_service_1 = require("./fraud-action.service");
const fraud_case_service_1 = require("./fraud-case.service");
const risk_engine_service_1 = require("./risk-engine.service");
const trust_alert_service_1 = require("./trust-alert.service");
const MAX_SPEED_KMH = 120;
let RiderFraudDetectorService = class RiderFraudDetectorService {
    constructor(prisma, risk, cases, actions, alerts) {
        this.prisma = prisma;
        this.risk = risk;
        this.cases = cases;
        this.actions = actions;
        this.alerts = alerts;
    }
    async evaluateDeliveryCompletion(orderId, riderProfileId, lat, lng) {
        const rider = await this.prisma.riderProfile.findUnique({
            where: { id: riderProfileId },
            select: { userId: true },
        });
        if (!rider)
            return;
        if (lat != null && lng != null) {
            const lastGeo = await this.prisma.geoVerification.findFirst({
                where: { riderProfileId },
                orderBy: { createdAt: 'desc' },
            });
            if (lastGeo) {
                const speed = this.haversineSpeedKmh(lastGeo.latitude, lastGeo.longitude, lat, lng, (Date.now() - lastGeo.createdAt.getTime()) / 1000);
                if (speed > MAX_SPEED_KMH) {
                    await this.flagGpsSpoof(rider.userId, orderId, speed);
                }
            }
            await this.prisma.geoVerification.create({
                data: {
                    userId: rider.userId,
                    orderId,
                    riderProfileId,
                    latitude: lat,
                    longitude: lng,
                    passed: true,
                },
            });
        }
        const delivery = await this.prisma.delivery.findUnique({
            where: { orderId },
            select: { pickedUpAt: true, deliveredAt: true, status: true },
        });
        if (delivery?.pickedUpAt && delivery.deliveredAt) {
            const minutes = (delivery.deliveredAt.getTime() - delivery.pickedUpAt.getTime()) / 60000;
            if (minutes < 2) {
                await this.risk.recordEvent({
                    userId: rider.userId,
                    eventType: 'DELIVERY_TIME_ANOMALY',
                    severity: 'HIGH',
                    idempotencyKey: `delivery-fast:${orderId}`,
                    metadata: { minutes },
                });
            }
        }
        const cod = await this.prisma.codReconciliation.findFirst({ where: { orderId } });
        if (cod && cod.status === 'REJECTED') {
            await this.flagCodMismatch(rider.userId, orderId);
        }
    }
    haversineSpeedKmh(lat1, lng1, lat2, lng2, seconds) {
        if (seconds <= 0)
            return 0;
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (km / seconds) * 3600;
    }
    async flagGpsSpoof(userId, orderId, speedKmh) {
        const key = `rider-gps:${orderId}`;
        await this.risk.recordEvent({
            userId,
            eventType: 'RIDER_GPS_SPOOF',
            severity: 'CRITICAL',
            idempotencyKey: key,
            metadata: { speedKmh, orderId },
        });
        const fraudCase = await this.cases.openCase({
            userId,
            category: client_1.FraudCaseCategory.RIDER_FRAUD,
            severity: 'CRITICAL',
            title: 'GPS spoofing detected',
            description: `Impossible speed ${speedKmh.toFixed(0)} km/h`,
            subjectType: 'order',
            subjectId: orderId,
            idempotencyKey: key,
        });
        await this.actions.apply(userId, client_1.FraudDecisionAction.RIDER_SUSPEND, 'GPS spoofing', undefined, `${key}:action`);
        await this.alerts.raise(client_1.TrustAlertType.RIDER_ANOMALY, 'CRITICAL', 'Rider GPS anomaly', fraudCase.description, { caseId: fraudCase.id });
    }
    async flagCodMismatch(userId, orderId) {
        const key = `rider-cod-mismatch:${orderId}`;
        await this.cases.openCase({
            userId,
            category: client_1.FraudCaseCategory.RIDER_FRAUD,
            severity: 'HIGH',
            title: 'COD collection mismatch',
            description: `COD reconciliation rejected for order ${orderId}`,
            subjectType: 'order',
            subjectId: orderId,
            idempotencyKey: key,
        });
    }
};
exports.RiderFraudDetectorService = RiderFraudDetectorService;
exports.RiderFraudDetectorService = RiderFraudDetectorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        risk_engine_service_1.RiskEngineService,
        fraud_case_service_1.FraudCaseService,
        fraud_action_service_1.FraudActionService,
        trust_alert_service_1.TrustAlertService])
], RiderFraudDetectorService);
//# sourceMappingURL=rider-fraud-detector.service.js.map