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
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const configuration_1 = require("../../config/configuration");
let RazorpayService = RazorpayService_1 = class RazorpayService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(RazorpayService_1.name);
        const cfg = (0, configuration_1.getConfig)(config);
        this.nodeEnv = cfg.nodeEnv;
        this.keyId = this.config.get('RAZORPAY_KEY_ID', '') ?? '';
        this.keySecret = this.config.get('RAZORPAY_KEY_SECRET', '') ?? '';
        this.webhookSecret = this.config.get('RAZORPAY_WEBHOOK_SECRET', '') ?? '';
    }
    onModuleInit() {
        if (!this.keyId || !this.keySecret) {
            this.logger.warn('Razorpay keys not configured — online payments disabled (COD still works)');
            return;
        }
        if (this.nodeEnv === 'production' && !this.webhookSecret) {
            throw new Error('RAZORPAY_WEBHOOK_SECRET is required in production when Razorpay keys are configured');
        }
        this.client = new Razorpay({
            key_id: this.keyId,
            key_secret: this.keySecret,
        });
        this.logger.log('Razorpay client initialized');
    }
    isConfigured() {
        return Boolean(this.client);
    }
    hasWebhookSecret() {
        return this.webhookSecret.length > 0;
    }
    async createOrder(amountRupees, receipt) {
        if (!this.client) {
            throw new Error('Razorpay is not configured');
        }
        const amountPaise = Math.round(amountRupees * 100);
        const order = await this.client.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt,
        });
        return {
            id: order.id,
            amount: amountPaise,
            currency: order.currency,
        };
    }
    verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        if (!this.keySecret || !razorpaySignature)
            return false;
        const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', this.keySecret)
            .update(payload)
            .digest('hex');
        try {
            return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(razorpaySignature, 'hex'));
        }
        catch {
            return false;
        }
    }
    verifyWebhookSignature(rawBody, signature) {
        if (!this.webhookSecret || !signature)
            return false;
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(rawBody)
            .digest('hex');
        try {
            return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(signature, 'hex'));
        }
        catch {
            return false;
        }
    }
    async fetchOrderPayments(razorpayOrderId) {
        if (!this.client) {
            throw new Error('Razorpay is not configured');
        }
        const result = await this.client.orders.fetchPayments(razorpayOrderId);
        const items = result
            .items ?? [];
        return items;
    }
    async createRefund(razorpayPaymentId, amountRupees, notes) {
        if (!this.client) {
            throw new Error('Razorpay is not configured');
        }
        const amountPaise = Math.round(amountRupees * 100);
        const refund = await this.client.payments.refund(razorpayPaymentId, {
            amount: amountPaise,
            notes,
        });
        return {
            id: refund.id,
            amount: Number(refund.amount ?? amountPaise),
        };
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map