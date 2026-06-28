import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');
import * as crypto from 'crypto';
import { getConfig } from '../../config/configuration';

@Injectable()
export class RazorpayService implements OnModuleInit {
  private readonly logger = new Logger(RazorpayService.name);
  private client!: Razorpay;

  readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly nodeEnv: string;

  constructor(private readonly config: ConfigService) {
    const cfg = getConfig(config);
    this.nodeEnv = cfg.nodeEnv;
    this.keyId = this.config.get<string>('RAZORPAY_KEY_ID', '') ?? '';
    this.keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET', '') ?? '';
    this.webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET', '') ?? '';
  }

  onModuleInit(): void {
    if (!this.keyId || !this.keySecret) {
      this.logger.warn('Razorpay keys not configured — online payments disabled (COD still works)');
      return;
    }

    if (this.nodeEnv === 'production' && !this.webhookSecret) {
      throw new Error(
        'RAZORPAY_WEBHOOK_SECRET is required in production when Razorpay keys are configured',
      );
    }

    this.client = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
    this.logger.log('Razorpay client initialized');
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  hasWebhookSecret(): boolean {
    return this.webhookSecret.length > 0;
  }

  /**
   * Create a Razorpay order.
   * @param amountRupees  Amount in INR (fractional). Converted to paise internally.
   * @param receipt       Internal order ID / order number for reconciliation.
   */
  async createOrder(
    amountRupees: number,
    receipt: string,
  ): Promise<{ id: string; amount: number; currency: string }> {
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

  /**
   * Verify the client-side payment signature.
   * Razorpay signs: HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId)
   */
  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): boolean {
    if (!this.keySecret || !razorpaySignature) return false;

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(razorpaySignature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  /**
   * Verify an inbound webhook's X-Razorpay-Signature header.
   * Razorpay signs the raw request body using the webhook secret.
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  /** Fetch payments for a Razorpay order (server-side reconciliation). */
  async fetchOrderPayments(
    razorpayOrderId: string,
  ): Promise<Array<{ id: string; status: string }>> {
    if (!this.client) {
      throw new Error('Razorpay is not configured');
    }
    const result = await this.client.orders.fetchPayments(razorpayOrderId);
    const items = (result as { items?: Array<{ id: string; status: string }> }).items ?? [];
    return items;
  }

  /**
   * Issue a partial or full refund against a captured Razorpay payment.
   * Amount is in INR rupees; converted to paise internally.
   */
  async createRefund(
    razorpayPaymentId: string,
    amountRupees: number,
    notes?: Record<string, string>,
  ): Promise<{ id: string; amount: number }> {
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
}
