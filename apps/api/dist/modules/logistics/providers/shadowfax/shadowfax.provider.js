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
var ShadowfaxProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowfaxProvider = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const logistics_errors_1 = require("../../errors/logistics.errors");
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
function positiveAmount(value, fallback = 1) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
        return fallback;
    return Number(value.toFixed(2));
}
function positiveInteger(value, fallback = 1) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
        return fallback;
    return Math.max(fallback, Math.round(value));
}
function findNumberByKeys(value, keys) {
    const seen = new Set();
    const queue = [value];
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || seen.has(current))
            continue;
        seen.add(current);
        if (Array.isArray(current)) {
            queue.push(...current);
            continue;
        }
        if (typeof current !== 'object')
            continue;
        const row = current;
        for (const key of keys) {
            const found = asNumber(row[key]);
            if (found != null)
                return found;
        }
        queue.push(...Object.values(row));
    }
    return undefined;
}
function findStringByKeys(value, keys) {
    const seen = new Set();
    const queue = [value];
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || seen.has(current))
            continue;
        seen.add(current);
        if (Array.isArray(current)) {
            queue.push(...current);
            continue;
        }
        if (typeof current !== 'object')
            continue;
        const row = current;
        for (const key of keys) {
            const found = asString(row[key]);
            if (found)
                return found;
        }
        queue.push(...Object.values(row));
    }
    return undefined;
}
function primaryResponseRecord(raw) {
    const candidates = [
        raw.data,
        raw.result,
        raw.results,
        raw.response,
        raw.order,
        raw.shipment,
        raw,
    ];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            const first = candidate.find((item) => item && typeof item === 'object');
            if (first)
                return asRecord(first);
        }
        const row = asRecord(candidate);
        if (Object.keys(row).length > 0)
            return row;
    }
    return {};
}
function safeJson(value) {
    try {
        return JSON.stringify(value);
    }
    catch {
        return '[unserializable Shadowfax response]';
    }
}
function shadowfaxFailureMessage(raw) {
    const message = findStringByKeys(raw, ['message', 'detail']);
    const errors = findStringByKeys(raw, ['errors', 'error']);
    const success = raw.success;
    if (typeof success === 'boolean' && !success) {
        return errors ?? message ?? `Shadowfax returned unsuccessful response: ${safeJson(raw)}`;
    }
    if (message?.trim().toLowerCase() === 'failure') {
        return errors ? `${message}: ${errors}` : `${message}: ${safeJson(raw)}`;
    }
    return undefined;
}
let ShadowfaxProvider = ShadowfaxProvider_1 = class ShadowfaxProvider {
    constructor(client) {
        this.client = client;
        this.type = client_1.DeliveryProviderType.SHADOWFAX;
        this.logger = new common_1.Logger(ShadowfaxProvider_1.name);
    }
    async createShipment(input) {
        const payload = this.toCreatePayload(input);
        const missingFields = this.missingMarketplaceFields(payload);
        this.logger.log({
            orderId: input.orderId,
            payloadKeys: this.payloadKeys(payload),
            productCount: payload.product_details?.length ?? 0,
            missingFields,
        }, 'Shadowfax marketplace create payload prepared');
        if (missingFields.length > 0) {
            throw new logistics_errors_1.LogisticsProviderError(`Shadowfax payload missing required fields: ${missingFields.join(', ')}`, client_1.DeliveryProviderType.SHADOWFAX, 'SHADOWFAX_PAYLOAD_INVALID', false, undefined, { providerMessage: `Missing required fields: ${missingFields.join(', ')}` });
        }
        const raw = await this.client.createShipment(payload);
        const failureMessage = shadowfaxFailureMessage(raw);
        if (failureMessage) {
            this.logger.error({
                orderId: input.orderId,
                providerMessage: failureMessage,
                shadowfaxResponse: raw,
            }, 'Shadowfax marketplace create returned failure response');
            throw new logistics_errors_1.LogisticsProviderError(`Shadowfax API failed: ${failureMessage}`, client_1.DeliveryProviderType.SHADOWFAX, 'SHADOWFAX_CREATE_FAILED', false, undefined, { providerMessage: failureMessage });
        }
        const data = primaryResponseRecord(raw);
        const awbNumber = findStringByKeys(raw, ['awb_number', 'awbNumber', 'awb', 'AWB']);
        const shadowfaxOrderId = findStringByKeys(raw, ['sfx_order_id', 'sfxOrderId', 'shadowfax_order_id']);
        const shipmentId = findStringByKeys(raw, ['shipment_id', 'shipmentId', 'id']);
        const trackingId = findStringByKeys(raw, ['tracking_id', 'trackingId', 'tracking_number', 'trackingNumber']);
        const externalShipmentId = awbNumber ??
            shadowfaxOrderId ??
            shipmentId ??
            trackingId ??
            input.awbNumber ??
            '';
        const trackingNumber = awbNumber ??
            trackingId ??
            shadowfaxOrderId ??
            externalShipmentId;
        if (!externalShipmentId) {
            throw new logistics_errors_1.LogisticsProviderError('Shadowfax create order response did not include AWB/tracking identifier', client_1.DeliveryProviderType.SHADOWFAX, 'MISSING_SHIPMENT_IDENTIFIER', false, undefined, { providerMessage: 'Missing awb_number/tracking_id/sfx_order_id in Shadowfax response' });
        }
        const providerStatus = findStringByKeys(raw, ['status_id', 'status']) ??
            'new';
        const etaMins = findNumberByKeys(raw, ['estimated_delivery_time', 'eta_minutes']);
        return {
            externalShipmentId,
            trackingNumber,
            estimatedEtaMins: etaMins,
            estimatedArrivalAt: etaMins ? new Date(Date.now() + etaMins * 60_000) : undefined,
            deliveryCost: findNumberByKeys(raw, ['delivery_charge', 'charge']),
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
    toCreatePayload(input) {
        const pickup = this.toAddress(input.pickup);
        const dropoff = this.toAddress(input.dropoff);
        const amounts = this.resolveAmounts(input);
        const productDetails = this.toProductDetails(input, amounts.productValue);
        const pkg = {
            weightGrams: positiveInteger(input.package?.weightGrams ?? input.weightGrams, 500),
            lengthCm: positiveInteger(input.package?.lengthCm, 10),
            breadthCm: positiveInteger(input.package?.breadthCm, 10),
            heightCm: positiveInteger(input.package?.heightCm, 10),
        };
        const isCod = amounts.codAmount > 0;
        return {
            order_details: {
                client_order_id: input.orderNumber,
                awb_number: input.awbNumber,
                paid: !isCod,
                payment_mode: isCod ? 'COD' : 'PREPAID',
                order_value: amounts.invoiceValue,
                product_value: amounts.productValue,
                declared_value: amounts.declaredValue,
                invoice_value: amounts.invoiceValue,
                payable_amount: amounts.payableAmount,
                cod_amount: amounts.codAmount,
                weight: pkg.weightGrams,
                actual_weight: pkg.weightGrams,
                length: pkg.lengthCm,
                breadth: pkg.breadthCm,
                height: pkg.heightCm,
                pickup_details: pickup,
                drop_details: dropoff,
                order_items: productDetails,
            },
            customer_details: dropoff,
            pickup_details: pickup,
            rts_details: pickup,
            product_details: productDetails,
        };
    }
    resolveAmounts(input) {
        const lineValue = input.items?.reduce((sum, item) => sum + positiveAmount(item.totalPrice), 0) ?? 0;
        const productValue = positiveAmount(input.amounts?.productValue || lineValue || input.amounts?.subtotal || input.amounts?.totalAmount || input.codAmount);
        const invoiceValue = positiveAmount(input.amounts?.invoiceValue || input.amounts?.totalAmount || productValue);
        return {
            productValue,
            declaredValue: positiveAmount(input.amounts?.declaredValue || productValue),
            invoiceValue,
            payableAmount: positiveAmount(input.amounts?.payableAmount || invoiceValue),
            codAmount: Number(Math.max(0, input.amounts?.codAmount ?? input.codAmount ?? 0).toFixed(2)),
        };
    }
    toProductDetails(input, fallbackValue) {
        const items = input.items?.length
            ? input.items
            : [{
                    name: 'JebDekho order',
                    quantity: 1,
                    unitPrice: fallbackValue,
                    totalPrice: fallbackValue,
                    weightGrams: input.package?.weightGrams ?? input.weightGrams,
                }];
        return items.map((item, index) => {
            const quantity = positiveInteger(item.quantity);
            const totalValue = positiveAmount(item.totalPrice || item.unitPrice * quantity || fallbackValue);
            const unitValue = positiveAmount(item.unitPrice || totalValue / quantity || fallbackValue);
            const name = item.name.trim() || `JebDekho item ${index + 1}`;
            return {
                product_name: name,
                name,
                sku_name: item.sku?.trim() || name,
                description: name,
                sku: item.sku,
                hsn_code: item.hsnCode,
                quantity,
                price: unitValue,
                unit_price: unitValue,
                value: totalValue,
                item_value: totalValue,
                product_value: totalValue,
                tax: item.tax,
                discount: item.discount,
                weight: positiveInteger(item.weightGrams ?? input.package?.weightGrams ?? input.weightGrams, 500),
            };
        });
    }
    missingMarketplaceFields(payload) {
        const missing = [];
        const order = payload.order_details;
        if (!order.client_order_id)
            missing.push('order_details.client_order_id');
        if (!positiveAmount(order.order_value, 0))
            missing.push('order_details.order_value');
        if (!positiveAmount(order.product_value, 0))
            missing.push('order_details.product_value');
        if (!positiveAmount(order.declared_value, 0))
            missing.push('order_details.declared_value');
        if (!positiveAmount(order.invoice_value, 0))
            missing.push('order_details.invoice_value');
        if (!positiveAmount(order.payable_amount, 0))
            missing.push('order_details.payable_amount');
        if (!order.payment_mode)
            missing.push('order_details.payment_mode');
        if (!payload.customer_details)
            missing.push('customer_details');
        if (!payload.pickup_details)
            missing.push('pickup_details');
        if (!payload.rts_details)
            missing.push('rts_details');
        if (!payload.product_details?.length)
            missing.push('product_details');
        payload.product_details?.forEach((item, index) => {
            if (!item.product_name)
                missing.push(`product_details.${index}.product_name`);
            if (!item.sku_name)
                missing.push(`product_details.${index}.sku_name`);
            if (!positiveInteger(item.quantity, 0))
                missing.push(`product_details.${index}.quantity`);
            if (!positiveAmount(item.product_value, 0))
                missing.push(`product_details.${index}.product_value`);
            if (!positiveAmount(item.item_value, 0))
                missing.push(`product_details.${index}.item_value`);
        });
        return missing;
    }
    payloadKeys(payload) {
        return {
            topLevel: Object.keys(payload).sort(),
            order_details: Object.keys(payload.order_details).sort(),
            customer_details: payload.customer_details ? Object.keys(payload.customer_details).sort() : [],
            pickup_details: payload.pickup_details ? Object.keys(payload.pickup_details).sort() : [],
            rts_details: payload.rts_details ? Object.keys(payload.rts_details).sort() : [],
            product_details: {
                count: payload.product_details?.length ?? 0,
                itemKeys: payload.product_details?.[0] ? Object.keys(payload.product_details[0]).sort() : [],
            },
        };
    }
};
exports.ShadowfaxProvider = ShadowfaxProvider;
exports.ShadowfaxProvider = ShadowfaxProvider = ShadowfaxProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shadowfax_client_1.ShadowfaxClient])
], ShadowfaxProvider);
//# sourceMappingURL=shadowfax.provider.js.map