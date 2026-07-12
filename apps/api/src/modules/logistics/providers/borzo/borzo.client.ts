import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, type AxiosInstance } from 'axios';
import { DeliveryProviderType } from '@prisma/client';
import {
  LOGISTICS_HTTP_TIMEOUT_MS,
  LOGISTICS_RETRY_DELAY_MS,
  LOGISTICS_RETRY_MAX,
} from '../../logistics.constants';
import { LogisticsProviderError } from '../../errors/logistics.errors';
import { maskSensitivePayload } from '../../utils/mask-sensitive.util';

/** One address/stop in a Borzo order. First point is the pickup, rest are drops. */
export interface BorzoPoint {
  address: string;
  contact_person: { phone: string; name?: string };
  latitude?: string;
  longitude?: string;
  client_order_id?: string;
  note?: string;
  /** COD: cash to collect from the recipient at this point (₹, 2dp string). */
  taking_amount?: string;
  is_cod_cash_voucher_required?: boolean;
}

export interface BorzoCreatePayload {
  type?: string;
  matter: string;
  vehicle_type_id?: number;
  total_weight_kg?: number;
  is_client_notification_enabled?: boolean;
  is_contact_person_notification_enabled?: boolean;
  points: BorzoPoint[];
}

/** Shape of every Borzo Business API response envelope. */
export interface BorzoResponse extends Record<string, unknown> {
  is_successful?: boolean;
  errors?: string[];
  parameter_errors?: Record<string, unknown> | null;
}

/**
 * Thin transport for the Borzo Business API 1.8. Auth is a single
 * `X-DV-Auth-Token` header. All writes are POST with a JSON body; reads
 * (orders, courier) are GET with a query string.
 */
@Injectable()
export class BorzoClient {
  private readonly logger = new Logger(BorzoClient.name);
  private readonly http: AxiosInstance;
  private readonly apiUrl: string;
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = (config.get<string>('BORZO_API_URL', '') ?? '').trim().replace(/\/$/, '');
    this.token = (config.get<string>('BORZO_AUTH_TOKEN', '') ?? '').trim();
    this.http = axios.create({
      baseURL: this.apiUrl || undefined,
      timeout: LOGISTICS_HTTP_TIMEOUT_MS,
      headers: {
        'X-DV-Auth-Token': this.token,
        'Content-Type': 'application/json',
      },
    });
    this.logger.log(
      { baseUrl: this.apiUrl || '(not set)', tokenPresent: Boolean(this.token) },
      'Borzo configuration resolved',
    );
  }

  isConfigured(): boolean {
    return Boolean(this.apiUrl && this.token);
  }

  /** Validate params and get a price without placing the order. */
  calculateOrder(payload: BorzoCreatePayload): Promise<BorzoResponse> {
    return this.request('POST', '/calculate-order', payload);
  }

  createOrder(payload: BorzoCreatePayload): Promise<BorzoResponse> {
    return this.request('POST', '/create-order', payload);
  }

  cancelOrder(orderId: string): Promise<BorzoResponse> {
    return this.request('POST', '/cancel-order', { order_id: Number(orderId) });
  }

  /** Fetch a single order (used for tracking). */
  getOrder(orderId: string): Promise<BorzoResponse> {
    return this.request('GET', `/orders?order_id=${encodeURIComponent(orderId)}`);
  }

  /** Courier info + live location for an active order. */
  getCourier(orderId: string): Promise<BorzoResponse> {
    return this.request('GET', `/courier?order_id=${encodeURIComponent(orderId)}`);
  }

  /** Cheapest healthy probe: the root endpoint returns { is_successful: true }. */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; message?: string }> {
    const started = Date.now();
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'Borzo not configured (BORZO_API_URL / BORZO_AUTH_TOKEN)' };
    }
    try {
      const res = await this.http.get('', { validateStatus: () => true });
      const healthy = res.status >= 200 && res.status < 400 && res.data?.is_successful !== false;
      return {
        healthy,
        latencyMs: Date.now() - started,
        message: healthy ? undefined : `Borzo health returned HTTP ${res.status}`,
      };
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
  ): Promise<BorzoResponse> {
    if (!this.isConfigured()) {
      throw new LogisticsProviderError(
        'Borzo API is not configured (BORZO_API_URL / BORZO_AUTH_TOKEN)',
        DeliveryProviderType.BORZO,
        'NOT_CONFIGURED',
        false,
      );
    }

    const started = Date.now();
    try {
      const response =
        method === 'GET' ? await this.http.get(path) : await this.http.post(path, body);
      const data = (response.data ?? {}) as BorzoResponse;
      this.logger.log(
        { method, path, status: response.status, latencyMs: Date.now() - started },
        'Borzo API response',
      );

      // Borzo returns HTTP 400 with { is_successful: false } on validation errors,
      // but a 200 with is_successful:false is still a failure — surface both.
      if (data.is_successful === false) {
        throw this.toProviderError(400, data, undefined);
      }
      return data;
    } catch (err) {
      if (err instanceof LogisticsProviderError) throw err;

      const axiosErr = err as AxiosError<BorzoResponse>;
      const status = axiosErr.response?.status;
      const responseBody = axiosErr.response?.data;
      const retryable = status === 429 || (status != null && status >= 500);

      this.logger.error(
        {
          method,
          path,
          status,
          latencyMs: Date.now() - started,
          attempt,
          providerBody: maskSensitivePayload(responseBody),
        },
        'Borzo API error',
      );

      if (retryable && attempt < LOGISTICS_RETRY_MAX) {
        await new Promise((r) => setTimeout(r, LOGISTICS_RETRY_DELAY_MS * attempt));
        return this.request(method, path, body, attempt + 1);
      }

      throw this.toProviderError(status, responseBody, axiosErr);
    }
  }

  private toProviderError(
    status: number | undefined,
    body: BorzoResponse | undefined,
    cause: unknown,
  ): LogisticsProviderError {
    const message = borzoErrorMessage(body) || (cause as AxiosError | undefined)?.message || 'request failed';
    const retryable = status === 429 || (status != null && status >= 500);
    return new LogisticsProviderError(
      `Borzo API failed: ${message}`,
      DeliveryProviderType.BORZO,
      status ? String(status) : 'NETWORK_ERROR',
      retryable,
      cause,
      { providerStatusCode: status, providerMessage: message },
    );
  }
}

/**
 * Flatten Borzo's `errors` + nested `parameter_errors` into one readable string,
 * e.g. `invalid_parameters; points.1.contact_person.phone: required`.
 */
export function borzoErrorMessage(body: BorzoResponse | undefined): string {
  if (!body) return '';
  const parts: string[] = [];
  if (Array.isArray(body.errors) && body.errors.length) parts.push(body.errors.join(', '));

  const flattenParams = (value: unknown, prefix: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item == null) return;
        if (typeof item === 'string') parts.push(`${prefix}: ${item}`);
        else flattenParams(item, `${prefix}.${index}`);
      });
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        flattenParams(val, prefix ? `${prefix}.${key}` : key);
      }
    }
  };
  if (body.parameter_errors) flattenParams(body.parameter_errors, '');

  return parts.join('; ').slice(0, 400);
}
