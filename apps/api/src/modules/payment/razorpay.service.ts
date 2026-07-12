import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');
import axios, { AxiosError, type AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { getConfig } from '../../config/configuration';

export interface CreateLinkedAccountInput {
  email: string;
  phone: string;
  legalBusinessName: string;
  /** Razorpay business type, e.g. 'proprietorship' | 'individual' | 'partnership'. */
  businessType?: string;
  referenceId?: string;
  bank: {
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
  };
}

export interface RouteTransferResult {
  id: string;
  status: string;
  amount: number;
}

@Injectable()
export class RazorpayService implements OnModuleInit {
  private readonly logger = new Logger(RazorpayService.name);
  private client!: Razorpay;
  /** Raw REST client for Route endpoints not exposed by the SDK version. */
  private route!: AxiosInstance;

  readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly nodeEnv: string;
  private readonly routeEnabled: boolean;

  constructor(private readonly config: ConfigService) {
    const cfg = getConfig(config);
    this.nodeEnv = cfg.nodeEnv;
    this.keyId = this.config.get<string>('RAZORPAY_KEY_ID', '') ?? '';
    this.keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET', '') ?? '';
    this.webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET', '') ?? '';
    this.routeEnabled = cfg.razorpay.routeEnabled;
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
    this.route = axios.create({
      baseURL: 'https://api.razorpay.com',
      auth: { username: this.keyId, password: this.keySecret },
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    this.logger.log({ routeEnabled: this.routeEnabled }, 'Razorpay client initialized');
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  isRouteEnabled(): boolean {
    return this.routeEnabled && Boolean(this.client);
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
  ): Promise<Array<{ id: string; status: string; contact?: string; email?: string }>> {
    if (!this.client) {
      throw new Error('Razorpay is not configured');
    }
    const result = await this.client.orders.fetchPayments(razorpayOrderId);
    const items =
      (result as { items?: Array<{ id: string; status: string; contact?: string; email?: string }> })
        .items ?? [];
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

  // ── Razorpay Route (Linked Accounts + Transfers) ──────────────────────────

  /**
   * Create a Route Linked Account for a merchant and configure its settlement
   * bank so we can transfer their commission-net earnings to it. Returns the
   * `acc_xxx` id to persist on the merchant profile.
   *
   * Uses the raw REST API (`/v1/accounts` + `/v1/accounts/:id/products`) because
   * the pinned SDK version does not expose Route onboarding.
   */
  async createLinkedAccount(input: CreateLinkedAccountInput): Promise<{ accountId: string }> {
    this.assertRoute();
    try {
      const account = await this.route.post<{ id: string }>('/v1/accounts', {
        email: input.email,
        phone: input.phone.replace(/\D/g, '').slice(-10),
        type: 'route',
        reference_id: input.referenceId,
        legal_business_name: input.legalBusinessName,
        business_type: input.businessType ?? 'proprietorship',
        legal_info: {},
        profile: { category: 'ecommerce', subcategory: 'marketplace' },
      });
      const accountId = account.data?.id;
      if (!accountId) throw new Error('Razorpay did not return a linked account id');

      // Attach the settlement bank so Route transfers can be paid out.
      await this.route.post(`/v1/accounts/${accountId}/products`, {
        product_name: 'route',
        tnc_accepted: true,
        settlements: {
          account_number: input.bank.accountNumber,
          ifsc_code: input.bank.ifsc,
          beneficiary_name: input.bank.accountHolderName,
        },
      });

      this.logger.log({ accountId, ref: input.referenceId }, 'Razorpay linked account created');
      return { accountId };
    } catch (err) {
      throw this.routeError('createLinkedAccount', err);
    }
  }

  /**
   * Transfer money from the platform balance to a merchant's Linked Account —
   * this is the actual settlement of their earnings after our commission.
   */
  async createTransfer(input: {
    linkedAccountId: string;
    amountRupees: number;
    notes?: Record<string, string>;
    referenceId?: string;
  }): Promise<RouteTransferResult> {
    this.assertRoute();
    const amountPaise = Math.round(input.amountRupees * 100);
    if (amountPaise <= 0) throw new Error('Transfer amount must be greater than zero');
    try {
      const res = await this.route.post<{ id: string; status: string; amount: number }>(
        '/v1/transfers',
        {
          account: input.linkedAccountId,
          amount: amountPaise,
          currency: 'INR',
          notes: input.notes,
        },
      );
      return {
        id: res.data.id,
        status: res.data.status,
        amount: Number(res.data.amount ?? amountPaise),
      };
    } catch (err) {
      throw this.routeError('createTransfer', err);
    }
  }

  async fetchTransfer(transferId: string): Promise<{ id: string; status: string; amount: number }> {
    this.assertRoute();
    try {
      const res = await this.route.get<{ id: string; status: string; amount: number }>(
        `/v1/transfers/${transferId}`,
      );
      return { id: res.data.id, status: res.data.status, amount: Number(res.data.amount) };
    } catch (err) {
      throw this.routeError('fetchTransfer', err);
    }
  }

  private assertRoute(): void {
    if (!this.isRouteEnabled()) {
      throw new Error('Razorpay Route is not enabled (RAZORPAY_ROUTE_ENABLED / keys)');
    }
  }

  private routeError(op: string, err: unknown): Error {
    const axiosErr = err as AxiosError<{ error?: { description?: string; reason?: string } }>;
    const description =
      axiosErr.response?.data?.error?.description ??
      (err instanceof Error ? err.message : 'Razorpay Route request failed');
    this.logger.error(
      { op, status: axiosErr.response?.status, description },
      'Razorpay Route error',
    );
    return new Error(`Razorpay Route ${op} failed: ${description}`);
  }
}
