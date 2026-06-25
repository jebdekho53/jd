import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService implements OnModuleInit {
  private readonly logger = new Logger(RazorpayService.name);
  private client!: Razorpay;

  readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.keyId = this.config.getOrThrow<string>('RAZORPAY_KEY_ID');
    this.keySecret = this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = this.config.getOrThrow<string>('RAZORPAY_WEBHOOK_SECRET');
  }

  onModuleInit(): void {
    this.client = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
    this.logger.log('Razorpay client initialized');
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
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpaySignature, 'hex'),
    );
  }

  /**
   * Verify an inbound webhook's X-Razorpay-Signature header.
   * Razorpay signs the raw request body using the webhook secret.
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
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
}
