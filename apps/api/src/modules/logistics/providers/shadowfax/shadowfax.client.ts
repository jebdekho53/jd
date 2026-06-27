import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, type AxiosInstance } from 'axios';
import { DeliveryProviderType } from '@prisma/client';
import { LOGISTICS_HTTP_TIMEOUT_MS, LOGISTICS_RETRY_DELAY_MS, LOGISTICS_RETRY_MAX } from '../../logistics.constants';
import { LogisticsProviderError } from '../../errors/logistics.errors';
import { maskSensitivePayload } from '../../utils/mask-sensitive.util';

export interface ShadowfaxCreatePayload {
  order_details: {
    client_order_id: string;
    order_value?: number;
    paid: boolean;
    pickup_details: ShadowfaxAddressPayload;
    drop_details: ShadowfaxAddressPayload;
    order_items?: Array<{ name: string; quantity: number; price?: number }>;
  };
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

  constructor(private readonly config: ConfigService) {
    this.apiUrl = (config.get<string>('SHADOWFAX_API_URL', '') ?? '').replace(/\/$/, '');
    const nodeEnv = config.get<string>('NODE_ENV', 'development');
    this.token =
      nodeEnv === 'production'
        ? (config.get<string>('SHADOWFAX_PRODUCTION_TOKEN', '') ?? '')
        : (config.get<string>('SHADOWFAX_TEST_TOKEN', '') ??
          config.get<string>('SHADOWFAX_PRODUCTION_TOKEN', '') ??
          '');
    this.http = axios.create({
      baseURL: this.apiUrl || undefined,
      timeout: LOGISTICS_HTTP_TIMEOUT_MS,
      headers: {
        Authorization: this.token ? `Token ${this.token}` : undefined,
        'Content-Type': 'application/json',
      },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.apiUrl && this.token);
  }

  async createShipment(payload: ShadowfaxCreatePayload): Promise<Record<string, unknown>> {
    return this.request('POST', '/api/v3/clients/shipments/', payload);
  }

  async cancelShipment(shipmentId: string, reason?: string): Promise<Record<string, unknown>> {
    return this.request('POST', `/api/v3/clients/shipments/${shipmentId}/cancel/`, {
      reason: reason ?? 'Cancelled by merchant',
    });
  }

  async trackShipment(shipmentId: string): Promise<Record<string, unknown>> {
    return this.request('GET', `/api/v3/clients/shipments/${shipmentId}/track/`);
  }

  async estimatePrice(payload: {
    pickup_lat: number;
    pickup_lng: number;
    drop_lat: number;
    drop_lng: number;
    weight_g?: number;
  }): Promise<Record<string, unknown>> {
    return this.request('POST', '/api/v3/clients/serviceability/', payload);
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; message?: string }> {
    const started = Date.now();
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'Shadowfax API not configured' };
    }
    try {
      await this.http.get('/api/v3/clients/health/', { validateStatus: () => true });
      return { healthy: true, latencyMs: Date.now() - started };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : 'Health check failed',
      };
    }
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    attempt = 1,
  ): Promise<Record<string, unknown>> {
    if (!this.isConfigured()) {
      throw new LogisticsProviderError(
        'Shadowfax API is not configured (SHADOWFAX_API_URL / token)',
        DeliveryProviderType.SHADOWFAX,
        'NOT_CONFIGURED',
        false,
      );
    }

    const started = Date.now();
    try {
      this.logger.debug(
        { method, path, body: body ? maskSensitivePayload(body) : undefined },
        'Shadowfax API request',
      );
      const response =
        method === 'GET'
          ? await this.http.get(path)
          : await this.http.post(path, body);
      const latencyMs = Date.now() - started;
      this.logger.log(
        { method, path, status: response.status, latencyMs },
        'Shadowfax API response',
      );
      return (response.data ?? {}) as Record<string, unknown>;
    } catch (err) {
      const latencyMs = Date.now() - started;
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;
      const retryable = status === 429 || (status != null && status >= 500);
      const responseBody = maskSensitivePayload(axiosErr.response?.data);

      this.logger.error(
        { method, path, status, latencyMs, responseBody, attempt },
        'Shadowfax API error',
      );

      if (retryable && attempt < LOGISTICS_RETRY_MAX) {
        await new Promise((r) => setTimeout(r, LOGISTICS_RETRY_DELAY_MS * attempt));
        return this.request(method, path, body, attempt + 1);
      }

      throw new LogisticsProviderError(
        `Shadowfax API failed: ${axiosErr.message}`,
        DeliveryProviderType.SHADOWFAX,
        status ? String(status) : 'NETWORK_ERROR',
        retryable,
        err,
      );
    }
  }
}
