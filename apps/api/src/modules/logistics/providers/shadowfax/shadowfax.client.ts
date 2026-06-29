import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, type AxiosInstance } from 'axios';
import { DeliveryProviderType } from '@prisma/client';
import { LOGISTICS_HTTP_TIMEOUT_MS, LOGISTICS_RETRY_DELAY_MS, LOGISTICS_RETRY_MAX } from '../../logistics.constants';
import { LogisticsProviderError } from '../../errors/logistics.errors';
import { maskSensitivePayload } from '../../utils/mask-sensitive.util';
import {
  assertSupportedShadowfaxPath,
  maskShadowfaxToken,
  normalizeShadowfaxApiBase,
  resolveShadowfaxApiMode,
  shadowfaxRequestTarget,
} from './shadowfax-url.util';
import {
  shadowfaxEndpointsForMode,
  type ShadowfaxApiMode,
} from './shadowfax.endpoints';

export interface ShadowfaxCreatePayload {
  order_details: {
    client_order_id: string;
    order_value?: number;
    paid: boolean;
    payment_mode?: ShadowfaxPaymentMode;
    pickup_details: ShadowfaxAddressPayload;
    drop_details: ShadowfaxAddressPayload;
    order_items?: Array<{ name: string; quantity: number; price?: number }>;
  };
}

export type ShadowfaxPaymentMode = 'COD' | 'PREPAID';

export interface ShadowfaxFlashCreatePayload {
  pickup_details: Record<string, unknown>;
  drop_details: Record<string, unknown>;
  order_details: Record<string, unknown>;
  user_details: Record<string, unknown>;
}

export interface ShadowfaxAddressPayload {
  name: string;
  contact: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

@Injectable()
export class ShadowfaxClient {
  private readonly logger = new Logger(ShadowfaxClient.name);
  private readonly http: AxiosInstance;
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly apiMode: ShadowfaxApiMode;
  private readonly creditsKey: string;
  private readonly createOrderEndpoint: string;
  private readonly debugPayloads: boolean;

  constructor(private readonly config: ConfigService) {
    const rawUrl = config.get<string>('SHADOWFAX_API_URL', '') ?? '';
    this.apiMode = resolveShadowfaxApiMode(
      rawUrl,
      config.get<string>('SHADOWFAX_API_MODE', ''),
    );
    this.apiUrl = normalizeShadowfaxApiBase(rawUrl, this.apiMode);
    this.createOrderEndpoint = shadowfaxEndpointsForMode(this.apiMode).createOrder;
    this.debugPayloads = this.isDebugLoggingEnabled();
    const nodeEnv = config.get<string>('NODE_ENV', 'development');
    this.token =
      nodeEnv === 'production'
        ? (config.get<string>('SHADOWFAX_PRODUCTION_TOKEN', '') ?? '').trim()
        : (config.get<string>('SHADOWFAX_TEST_TOKEN', '') ??
          config.get<string>('SHADOWFAX_PRODUCTION_TOKEN', '') ??
          '').trim();
    this.creditsKey = config.get<string>('SHADOWFAX_CREDITS_KEY', '') ?? '';
    this.http = axios.create({
      baseURL: this.apiUrl || undefined,
      timeout: LOGISTICS_HTTP_TIMEOUT_MS,
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
    });
    this.logger.log(
      {
        baseUrl: this.apiUrl || '(not set)',
        apiMode: this.apiMode,
        createOrderEndpoint: this.createOrderEndpoint,
        tokenPresent: Boolean(this.token),
        tokenMasked: maskShadowfaxToken(this.token),
      },
      'Shadowfax configuration resolved',
    );
  }

  getApiMode(): ShadowfaxApiMode {
    return this.apiMode;
  }

  isConfigured(): boolean {
    if (!this.apiUrl || !this.token) return false;
    if (this.apiMode === 'flash' && !this.creditsKey) return false;
    return true;
  }

  async createShipment(payload: ShadowfaxCreatePayload): Promise<Record<string, unknown>> {
    const requestPayload = this.withPaymentMode(payload);
    if (this.apiMode === 'flash') {
      return this.createFlashOrder(requestPayload);
    }
    return this.request('POST', this.createOrderEndpoint, requestPayload);
  }

  async cancelShipment(shipmentId: string, reason?: string): Promise<Record<string, unknown>> {
    const endpoint = shadowfaxEndpointsForMode(this.apiMode).cancelOrder(shipmentId);
    if (this.apiMode === 'flash') {
      return this.request('POST', endpoint, { order_id: shipmentId });
    }
    return this.request('POST', endpoint, {
      reason: reason ?? 'Cancelled by merchant',
    });
  }

  async trackShipment(shipmentId: string): Promise<Record<string, unknown>> {
    return this.request('GET', shadowfaxEndpointsForMode(this.apiMode).trackOrder(shipmentId));
  }

  async estimatePrice(payload: {
    pickup_lat: number;
    pickup_lng: number;
    drop_lat: number;
    drop_lng: number;
    weight_g?: number;
  }): Promise<Record<string, unknown>> {
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
    return this.request('POST', shadowfaxEndpointsForMode(this.apiMode).serviceability, payload);
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; message?: string }> {
    const started = Date.now();
    if (!this.isConfigured()) {
      const missing =
        this.apiMode === 'flash' && !this.creditsKey
          ? 'Shadowfax Flash requires SHADOWFAX_CREDITS_KEY'
          : 'Shadowfax API not configured (SHADOWFAX_API_URL / token)';
      return { healthy: false, latencyMs: 0, message: missing };
    }
    try {
      const path = shadowfaxEndpointsForMode(this.apiMode).health;
      await this.http.request({
        method: this.apiMode === 'flash' ? 'POST' : 'GET',
        url: path,
        data:
          this.apiMode === 'flash'
            ? { pickup_details: { latitude: 28.61, longitude: 77.2 }, drop_details: { latitude: 28.62, longitude: 77.21 } }
            : undefined,
        validateStatus: () => true,
      });
      return { healthy: true, latencyMs: Date.now() - started };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : 'Health check failed',
      };
    }
  }

  private authHeader(): string | undefined {
    if (!this.token) return undefined;
    if (this.apiMode === 'flash') {
      return this.token;
    }
    return `Token ${this.token}`;
  }

  private withPaymentMode(payload: ShadowfaxCreatePayload): ShadowfaxCreatePayload {
    const paymentMode = payload.order_details.payment_mode ?? this.paymentModeForPayload(payload);
    return {
      ...payload,
      order_details: {
        ...payload.order_details,
        payment_mode: paymentMode,
      },
    };
  }

  private paymentModeForPayload(payload: ShadowfaxCreatePayload): ShadowfaxPaymentMode {
    return payload.order_details.paid ? 'PREPAID' : 'COD';
  }

  private isDebugLoggingEnabled(): boolean {
    const level = (this.config.get<string>('LOG_LEVEL', '') ?? '').toLowerCase();
    return level === 'debug' || level === 'trace';
  }

  private createFlashOrder(payload: ShadowfaxCreatePayload): Promise<Record<string, unknown>> {
    const pickup = payload.order_details.pickup_details;
    const drop = payload.order_details.drop_details;
    const flashPayload: ShadowfaxFlashCreatePayload = {
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

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    attempt = 1,
  ): Promise<Record<string, unknown>> {
    if (!this.isConfigured()) {
      throw new LogisticsProviderError(
        this.apiMode === 'flash'
          ? 'Shadowfax Flash is not configured (SHADOWFAX_API_URL, token, SHADOWFAX_CREDITS_KEY)'
          : 'Shadowfax API is not configured (SHADOWFAX_API_URL / token)',
        DeliveryProviderType.SHADOWFAX,
        'NOT_CONFIGURED',
        false,
      );
    }

    assertSupportedShadowfaxPath(this.apiMode, path);
    const requestTarget = shadowfaxRequestTarget(this.apiUrl, path);
    const started = Date.now();
    try {
      this.logger.log(
        {
          method,
          requestTarget,
          apiMode: this.apiMode,
        },
        'Shadowfax API request',
      );
      if (body && this.debugPayloads) {
        this.logger.debug(
          {
            method,
            requestTarget,
            apiMode: this.apiMode,
            body: maskSensitivePayload(body),
          },
          'Shadowfax API request payload',
        );
      }
      const response =
        method === 'GET'
          ? await this.http.get(path)
          : await this.http.post(path, body);
      const latencyMs = Date.now() - started;
      this.logger.log(
        { method, requestTarget, apiMode: this.apiMode, status: response.status, latencyMs },
        'Shadowfax API response',
      );
      return (response.data ?? {}) as Record<string, unknown>;
    } catch (err) {
      const latencyMs = Date.now() - started;
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;
      const retryable = status === 429 || (status != null && status >= 500);
      const responseBody = maskSensitivePayload(axiosErr.response?.data);
      const providerMessage = summarizeProviderBody(responseBody);

      this.logger.error(
        {
          method,
          requestTarget,
          apiMode: this.apiMode,
          status,
          latencyMs,
          providerMessage,
          attempt,
        },
        'Shadowfax API error',
      );

      if (retryable && attempt < LOGISTICS_RETRY_MAX) {
        await new Promise((r) => setTimeout(r, LOGISTICS_RETRY_DELAY_MS * attempt));
        return this.request(method, path, body, attempt + 1);
      }

      throw new LogisticsProviderError(
        `Shadowfax API failed: ${providerMessage || axiosErr.message}`,
        DeliveryProviderType.SHADOWFAX,
        status ? String(status) : 'NETWORK_ERROR',
        retryable,
        err,
        { providerStatusCode: status, providerMessage },
      );
    }
  }
}

function summarizeProviderBody(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const row = body as Record<string, unknown>;
  const msg =
    row.message ?? row.error ?? row.detail ?? row.reason ?? row.msg;
  if (typeof msg === 'string') return msg.slice(0, 300);
  if (Array.isArray(msg)) return msg.join('; ').slice(0, 300);
  return JSON.stringify(maskSensitivePayload(body)).slice(0, 300);
}
