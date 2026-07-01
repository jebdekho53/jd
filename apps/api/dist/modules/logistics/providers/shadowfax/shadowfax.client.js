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
var ShadowfaxClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowfaxClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const client_1 = require("@prisma/client");
const logistics_constants_1 = require("../../logistics.constants");
const logistics_errors_1 = require("../../errors/logistics.errors");
const mask_sensitive_util_1 = require("../../utils/mask-sensitive.util");
const shadowfax_url_util_1 = require("./shadowfax-url.util");
const shadowfax_endpoints_1 = require("./shadowfax.endpoints");
let ShadowfaxClient = ShadowfaxClient_1 = class ShadowfaxClient {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(ShadowfaxClient_1.name);
        const rawUrl = config.get('SHADOWFAX_API_URL', '') ?? '';
        this.apiMode = (0, shadowfax_url_util_1.resolveShadowfaxApiMode)(rawUrl, config.get('SHADOWFAX_API_MODE', ''));
        this.apiUrl = (0, shadowfax_url_util_1.normalizeShadowfaxApiBase)(rawUrl, this.apiMode);
        this.createOrderEndpoint = (0, shadowfax_endpoints_1.shadowfaxEndpointsForMode)(this.apiMode).createOrder;
        this.debugPayloads = this.isDebugLoggingEnabled();
        const nodeEnv = config.get('NODE_ENV', 'development');
        this.token =
            this.apiMode === 'dale_staging' || this.apiMode === 'hl_staging'
                ? (config.get('SHADOWFAX_TEST_TOKEN', '') ?? '').trim()
                : this.apiMode === 'dale_production'
                    ? (config.get('SHADOWFAX_PRODUCTION_TOKEN', '') ?? '').trim()
                    : nodeEnv === 'production'
                        ? (config.get('SHADOWFAX_PRODUCTION_TOKEN', '') ?? '').trim()
                        : (config.get('SHADOWFAX_TEST_TOKEN', '') ??
                            config.get('SHADOWFAX_PRODUCTION_TOKEN', '') ??
                            '').trim();
        this.creditsKey = config.get('SHADOWFAX_CREDITS_KEY', '') ?? '';
        this.http = axios_1.default.create({
            baseURL: this.apiUrl || undefined,
            timeout: logistics_constants_1.LOGISTICS_HTTP_TIMEOUT_MS,
            headers: {
                Authorization: this.authHeader(),
                'Content-Type': 'application/json',
            },
        });
        this.logger.log({
            baseUrl: this.apiUrl || '(not set)',
            apiMode: this.apiMode,
            createOrderEndpoint: this.createOrderEndpoint,
            tokenPresent: Boolean(this.token),
        }, 'Shadowfax configuration resolved');
    }
    getApiMode() {
        return this.apiMode;
    }
    isConfigured() {
        if (!this.apiUrl || !this.token)
            return false;
        if (this.apiMode === 'flash' && !this.creditsKey)
            return false;
        return true;
    }
    async createShipment(payload) {
        const requestPayload = this.withPaymentMode(payload);
        if (this.apiMode === 'dale_staging' || this.apiMode === 'dale_production') {
            return this.request('POST', this.createOrderEndpoint, requestPayload);
        }
        if (this.apiMode === 'legacy' || this.apiMode === 'hl_staging') {
            return this.createLegacyOrder(requestPayload);
        }
        if (this.apiMode === 'flash') {
            return this.createFlashOrder(requestPayload);
        }
        return this.request('POST', this.createOrderEndpoint, requestPayload);
    }
    async cancelShipment(shipmentId, reason) {
        const endpoint = (0, shadowfax_endpoints_1.shadowfaxEndpointsForMode)(this.apiMode).cancelOrder(shipmentId);
        if (this.apiMode === 'legacy' || this.apiMode === 'hl_staging') {
            return this.request('PUT', endpoint, { reason: reason ?? 'Cancelled by merchant' });
        }
        if (this.apiMode === 'flash') {
            return this.request('POST', endpoint, { order_id: shipmentId });
        }
        return this.request('POST', endpoint, {
            reason: reason ?? 'Cancelled by merchant',
        });
    }
    async trackShipment(shipmentId) {
        return this.request('GET', (0, shadowfax_endpoints_1.shadowfaxEndpointsForMode)(this.apiMode).trackOrder(shipmentId));
    }
    async estimatePrice(payload) {
        if (this.apiMode === 'dale_staging' || this.apiMode === 'dale_production') {
            return this.request('GET', this.daleServiceabilityPath(payload.pincode));
        }
        if (this.apiMode === 'legacy' || this.apiMode === 'hl_staging') {
            return this.request('PUT', (0, shadowfax_endpoints_1.shadowfaxEndpointsForMode)(this.apiMode).serviceability, this.legacyServiceabilityPayload(payload));
        }
        if (this.apiMode === 'flash') {
            return this.request('POST', '/order/serviceability/', {
                pickup_details: {
                    latitude: payload.pickup_lat,
                    longitude: payload.pickup_lng,
                },
                drop_details: {
                    latitude: payload.drop_lat,
                    longitude: payload.drop_lng,
                },
            });
        }
        return this.request('POST', (0, shadowfax_endpoints_1.shadowfaxEndpointsForMode)(this.apiMode).serviceability, payload);
    }
    async healthCheck() {
        const started = Date.now();
        if (!this.isConfigured()) {
            const missing = this.apiMode === 'flash' && !this.creditsKey
                ? 'Shadowfax Flash requires SHADOWFAX_CREDITS_KEY'
                : 'Shadowfax API not configured (SHADOWFAX_API_URL / token)';
            return { healthy: false, latencyMs: 0, message: missing };
        }
        try {
            const isDaleMode = this.apiMode === 'dale_staging' || this.apiMode === 'dale_production';
            const path = isDaleMode
                ? this.daleServiceabilityPath()
                : (0, shadowfax_endpoints_1.shadowfaxEndpointsForMode)(this.apiMode).health;
            const response = await this.http.request({
                method: isDaleMode ? 'GET' : this.apiMode === 'legacy' || this.apiMode === 'hl_staging' ? 'PUT' : this.apiMode === 'flash' ? 'POST' : 'GET',
                url: path,
                data: this.apiMode === 'legacy' || this.apiMode === 'hl_staging'
                    ? this.legacyServiceabilityPayload({ pickup_lat: 28.61, pickup_lng: 77.2, drop_lat: 28.62, drop_lng: 77.21 })
                    : this.apiMode === 'flash'
                        ? { pickup_details: { latitude: 28.61, longitude: 77.2 }, drop_details: { latitude: 28.62, longitude: 77.21 } }
                        : undefined,
                validateStatus: () => true,
            });
            if (response.status < 200 || response.status >= 400) {
                return {
                    healthy: false,
                    latencyMs: Date.now() - started,
                    message: `Shadowfax health returned HTTP ${response.status}`,
                };
            }
            return { healthy: true, latencyMs: Date.now() - started };
        }
        catch (err) {
            return {
                healthy: false,
                latencyMs: Date.now() - started,
                message: err instanceof Error ? err.message : 'Health check failed',
            };
        }
    }
    authHeader() {
        if (!this.token)
            return undefined;
        if (this.apiMode === 'flash') {
            return this.token;
        }
        return `Token ${this.token}`;
    }
    withPaymentMode(payload) {
        const paymentMode = payload.order_details.payment_mode ?? this.paymentModeForPayload(payload);
        return {
            ...payload,
            order_details: {
                ...payload.order_details,
                payment_mode: paymentMode,
            },
        };
    }
    paymentModeForPayload(payload) {
        return payload.order_details.paid ? 'PREPAID' : 'COD';
    }
    isDebugLoggingEnabled() {
        const level = (this.config.get('LOG_LEVEL', '') ?? '').toLowerCase();
        return level === 'debug' || level === 'trace';
    }
    daleServiceabilityPath(pincode) {
        const resolvedPincode = String(pincode ??
            this.config.get('SHADOWFAX_TEST_PINCODE') ??
            this.config.get('SHADOWFAX_TEST_DROPOFF_PINCODE') ??
            this.config.get('SHADOWFAX_SERVICEABILITY_PINCODE') ??
            '110001').trim();
        const query = new URLSearchParams({
            service: 'customer_delivery',
            page: '1',
            count: '10',
            pincodes: resolvedPincode,
        });
        return `${(0, shadowfax_endpoints_1.shadowfaxEndpointsForMode)(this.apiMode).serviceability}?${query.toString()}`;
    }
    createLegacyOrder(payload) {
        const order = payload.order_details;
        const pickup = order.pickup_details;
        const drop = order.drop_details;
        return this.request('POST', (0, shadowfax_endpoints_1.shadowfaxEndpointsForMode)(this.apiMode).createOrder, {
            order_details: {
                order_value: Number(order.order_value ?? 0),
                paid: String(order.paid),
                client_order_id: order.client_order_id,
            },
            pickup_details: {
                city: pickup.city,
                contact_number: this.normalizePhone(pickup.contact),
                name: pickup.name,
                longitude: pickup.longitude,
                latitude: pickup.latitude,
                address: [pickup.address_line_1, pickup.address_line_2].filter(Boolean).join(', '),
                pincode: pickup.pincode,
            },
            drop_details: {
                city: drop.city,
                contact_number: this.normalizePhone(drop.contact),
                name: drop.name,
                longitude: drop.longitude,
                latitude: drop.latitude,
                address: [drop.address_line_1, drop.address_line_2].filter(Boolean).join(', '),
                pincode: drop.pincode,
            },
        });
    }
    legacyServiceabilityPayload(payload) {
        return {
            pickup_longitude: String(payload.pickup_lng),
            pickup_latitude: String(payload.pickup_lat),
            drop_latitude: String(payload.drop_lat),
            drop_longitude: String(payload.drop_lng),
            paid: 'true',
            COID: `JD-SERVICEABILITY-${Date.now()}`,
            stage_of_check: 'pre_order',
            order_value: 1,
            rain_flag: false,
            client_surge: 0,
        };
    }
    createFlashOrder(payload) {
        const pickup = payload.order_details.pickup_details;
        const drop = payload.order_details.drop_details;
        const flashPayload = {
            pickup_details: {
                name: pickup.name,
                contact_number: this.normalizePhone(pickup.contact),
                address: [pickup.address_line_1, pickup.address_line_2].filter(Boolean).join(', '),
                latitude: pickup.latitude,
                longitude: pickup.longitude,
            },
            drop_details: {
                name: drop.name,
                contact_number: this.normalizePhone(drop.contact),
                address: [drop.address_line_1, drop.address_line_2].filter(Boolean).join(', '),
                latitude: drop.latitude,
                longitude: drop.longitude,
            },
            order_details: {
                order_id: payload.order_details.client_order_id,
                is_prepaid: payload.order_details.paid,
                cash_to_be_collected: payload.order_details.paid
                    ? 0
                    : Number(payload.order_details.order_value ?? 0),
            },
            user_details: {
                contact_number: this.normalizePhone(drop.contact),
                credits_key: this.creditsKey,
            },
        };
        return this.request('POST', '/order/create/', flashPayload);
    }
    normalizePhone(phone) {
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10 ? digits.slice(-10) : digits;
    }
    async request(method, path, body, attempt = 1) {
        if (!this.isConfigured()) {
            throw new logistics_errors_1.LogisticsProviderError(this.apiMode === 'flash'
                ? 'Shadowfax Flash is not configured (SHADOWFAX_API_URL, token, SHADOWFAX_CREDITS_KEY)'
                : 'Shadowfax API is not configured (SHADOWFAX_API_URL / token)', client_1.DeliveryProviderType.SHADOWFAX, 'NOT_CONFIGURED', false);
        }
        (0, shadowfax_url_util_1.assertSupportedShadowfaxPath)(this.apiMode, path);
        const requestTarget = (0, shadowfax_url_util_1.shadowfaxRequestTarget)(this.apiUrl, path);
        const started = Date.now();
        try {
            this.logger.log({
                method,
                requestTarget,
                apiMode: this.apiMode,
            }, 'Shadowfax API request');
            if (body && this.debugPayloads) {
                this.logger.debug({
                    method,
                    requestTarget,
                    apiMode: this.apiMode,
                    body: (0, mask_sensitive_util_1.maskSensitivePayload)(body),
                }, 'Shadowfax API request payload');
            }
            const response = method === 'GET'
                ? await this.http.get(path)
                : method === 'PUT'
                    ? await this.http.put(path, body)
                    : await this.http.post(path, body);
            const latencyMs = Date.now() - started;
            this.logger.log({ method, requestTarget, apiMode: this.apiMode, status: response.status, latencyMs }, 'Shadowfax API response');
            return (response.data ?? {});
        }
        catch (err) {
            const latencyMs = Date.now() - started;
            const axiosErr = err;
            const status = axiosErr.response?.status;
            const retryable = status === 429 || (status != null && status >= 500);
            const responseBody = (0, mask_sensitive_util_1.maskSensitivePayload)(axiosErr.response?.data);
            const providerMessage = summarizeProviderBody(responseBody);
            this.logger.error({
                method,
                requestTarget,
                apiMode: this.apiMode,
                status,
                latencyMs,
                providerMessage,
                attempt,
            }, 'Shadowfax API error');
            if (retryable && attempt < logistics_constants_1.LOGISTICS_RETRY_MAX) {
                await new Promise((r) => setTimeout(r, logistics_constants_1.LOGISTICS_RETRY_DELAY_MS * attempt));
                return this.request(method, path, body, attempt + 1);
            }
            throw new logistics_errors_1.LogisticsProviderError(`Shadowfax API failed: ${providerMessage || axiosErr.message}`, client_1.DeliveryProviderType.SHADOWFAX, status ? String(status) : 'NETWORK_ERROR', retryable, err, { providerStatusCode: status, providerMessage });
        }
    }
};
exports.ShadowfaxClient = ShadowfaxClient;
exports.ShadowfaxClient = ShadowfaxClient = ShadowfaxClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ShadowfaxClient);
function summarizeProviderBody(body) {
    if (!body || typeof body !== 'object')
        return '';
    const row = body;
    const msg = row.message ?? row.error ?? row.detail ?? row.reason ?? row.msg;
    if (typeof msg === 'string')
        return msg.slice(0, 300);
    if (Array.isArray(msg))
        return msg.join('; ').slice(0, 300);
    return JSON.stringify((0, mask_sensitive_util_1.maskSensitivePayload)(body)).slice(0, 300);
}
//# sourceMappingURL=shadowfax.client.js.map