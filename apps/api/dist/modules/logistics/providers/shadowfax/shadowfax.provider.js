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
exports.ShadowfaxProvider = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const shadowfax_status_mapper_1 = require("../../mappers/shadowfax-status.mapper");
const shadowfax_client_1 = require("./shadowfax.client");
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function asString(value) {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function asNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}
let ShadowfaxProvider = class ShadowfaxProvider {
    constructor(client) {
        this.client = client;
        this.type = client_1.DeliveryProviderType.SHADOWFAX;
    }
    async createShipment(input) {
        const raw = await this.client.createShipment({
            order_details: {
                client_order_id: input.orderNumber,
                paid: !input.codAmount,
                order_value: input.codAmount,
                pickup_details: this.toAddress(input.pickup),
                drop_details: this.toAddress(input.dropoff),
            },
        });
        const data = asRecord(raw.data ?? raw);
        const externalShipmentId = asString(data.shipment_id) ??
            asString(data.sfx_order_id) ??
            asString(data.id) ??
            asString(data.awb_number) ??
            '';
        const trackingNumber = asString(data.awb_number) ??
            asString(data.tracking_id) ??
            asString(data.sfx_order_id) ??
            externalShipmentId;
        const providerStatus = asString(data.status) ?? 'new';
        const etaMins = asNumber(data.estimated_delivery_time) ?? asNumber(data.eta_minutes);
        return {
            externalShipmentId,
            trackingNumber,
            estimatedEtaMins: etaMins,
            estimatedArrivalAt: etaMins ? new Date(Date.now() + etaMins * 60_000) : undefined,
            deliveryCost: asNumber(data.delivery_charge) ?? asNumber(data.charge),
            providerStatus,
            normalizedStatus: (0, shadowfax_status_mapper_1.mapShadowfaxStatus)(providerStatus),
            driverName: asString(data.rider_name) ?? asString(asRecord(data.rider).name),
            driverPhone: asString(data.rider_phone) ?? asString(asRecord(data.rider).phone),
            vehicleType: asString(data.vehicle_type) ?? asString(asRecord(data.rider).vehicle_type),
            labelUrl: asString(data.label_url),
            rawResponse: raw,
        };
    }
    async cancelShipment(externalShipmentId, reason) {
        await this.client.cancelShipment(externalShipmentId, reason);
    }
    async trackShipment(externalShipmentId) {
        const raw = await this.client.trackShipment(externalShipmentId);
        const data = asRecord(raw.data ?? raw);
        const providerStatus = asString(data.status) ?? asString(data.current_status) ?? 'pending';
        const rider = asRecord(data.rider);
        const etaMins = asNumber(data.estimated_delivery_time) ?? asNumber(data.eta_minutes);
        const timelineRaw = Array.isArray(data.tracking_details) ? data.tracking_details : [];
        return {
            externalShipmentId,
            trackingNumber: asString(data.awb_number) ?? asString(data.tracking_id) ?? externalShipmentId,
            providerStatus,
            normalizedStatus: (0, shadowfax_status_mapper_1.mapShadowfaxStatus)(providerStatus),
            estimatedEtaMins: etaMins,
            estimatedArrivalAt: etaMins ? new Date(Date.now() + etaMins * 60_000) : undefined,
            driverName: asString(data.rider_name) ?? asString(rider.name),
            driverPhone: asString(data.rider_phone) ?? asString(rider.phone),
            vehicleType: asString(data.vehicle_type) ?? asString(rider.vehicle_type),
            lat: asNumber(data.latitude) ?? asNumber(rider.latitude),
            lng: asNumber(data.longitude) ?? asNumber(rider.longitude),
            timeline: timelineRaw.map((item) => {
                const row = asRecord(item);
                const statusRaw = asString(row.status) ?? asString(row.event);
                return {
                    status: (0, shadowfax_status_mapper_1.mapShadowfaxStatus)(statusRaw),
                    description: asString(row.description) ?? statusRaw,
                    occurredAt: row.timestamp ? new Date(String(row.timestamp)) : new Date(),
                };
            }),
            rawResponse: raw,
        };
    }
    async estimatePrice(input) {
        const raw = await this.client.estimatePrice({
            pickup_lat: input.pickupLat,
            pickup_lng: input.pickupLng,
            drop_lat: input.dropoffLat,
            drop_lng: input.dropoffLng,
            weight_g: input.weightGrams,
        });
        const data = asRecord(raw.data ?? raw);
        return {
            amount: asNumber(data.charge) ?? asNumber(data.delivery_charge) ?? 0,
            currency: asString(data.currency) ?? 'INR',
            estimatedEtaMins: asNumber(data.eta_minutes) ?? asNumber(data.estimated_delivery_time),
        };
    }
    async estimateETA(input) {
        const estimate = await this.estimatePrice(input);
        return { estimatedMins: estimate.estimatedEtaMins ?? 30 };
    }
    async getProofOfDelivery(externalShipmentId) {
        const track = await this.trackShipment(externalShipmentId);
        const raw = track.rawResponse ?? {};
        const data = asRecord(raw.data ?? raw);
        return {
            podUrl: asString(data.pod_url) ?? asString(data.proof_of_delivery),
            deliveredAt: track.normalizedStatus === client_1.ShipmentProviderStatus.DELIVERED ? new Date() : undefined,
            signatureUrl: asString(data.signature_url),
        };
    }
    async downloadLabel(externalShipmentId) {
        const track = await this.trackShipment(externalShipmentId);
        const labelUrl = asString(asRecord(track.rawResponse).label_url) ??
            asString(asRecord(asRecord(track.rawResponse).data).label_url);
        if (!labelUrl) {
            throw new Error('Label not available for this shipment');
        }
        return { labelUrl };
    }
    async healthCheck() {
        const result = await this.client.healthCheck();
        return {
            healthy: result.healthy,
            latencyMs: result.latencyMs,
            message: result.message,
        };
    }
    toAddress(addr) {
        return {
            name: addr.name,
            contact: addr.phone,
            address_line_1: addr.line1,
            address_line_2: addr.line2,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            latitude: addr.lat,
            longitude: addr.lng,
        };
    }
};
exports.ShadowfaxProvider = ShadowfaxProvider;
exports.ShadowfaxProvider = ShadowfaxProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shadowfax_client_1.ShadowfaxClient])
], ShadowfaxProvider);
//# sourceMappingURL=shadowfax.provider.js.map