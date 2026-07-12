import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { getConfig } from '../../config/configuration';

export interface WhatsAppSendResult {
  /** Meta's `wamid.…`, or null when the send was rejected. */
  messageId: string | null;
  error?: string;
  /** Meta's numeric error code (e.g. 131047 = outside the 24-hour window). */
  errorCode?: number;
  httpStatus?: number;
}

/**
 * WhatsApp OTP delivery via the Meta WhatsApp Cloud API (Graph API).
 *
 * Design constraints (see the `whatsapp` block in configuration.ts):
 * - Gated by ENABLE_WHATSAPP_OTP. When OFF (the production default) every call is a
 *   no-op returning `false`, so the caller falls back to the existing MSG91/SMS path
 *   and real user signup is completely unaffected.
 * - While on a Meta TEST access token, only numbers registered as test recipients can
 *   receive messages. WHATSAPP_TEST_RECIPIENT_NUMBER pins the single allowed recipient;
 *   any other number is refused here (returns `false`) and falls back to SMS, so a
 *   flipped flag on a test token can never silently break OTP for real users.
 * - The access token is read fresh from config on every send (not memoised), so a token
 *   rotation is just an env update + process reload — no code change.
 *
 * Business-initiated WhatsApp messages must use an approved template, so this sends the
 * configured Authentication-category template (WHATSAPP_OTP_TEMPLATE_NAME) with the code
 * as the body parameter and the copy-code button parameter.
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(private readonly configService: ConfigService) {
    this.cfg = getConfig(configService);
  }

  /**
   * Attempt to send an OTP over WhatsApp.
   * @returns `true` only if the message was dispatched via WhatsApp; `false` means the
   *          caller should fall back to the SMS path (feature off, not the test
   *          recipient, or misconfigured).
   */
  async sendOtp(phone: string, code: string): Promise<boolean> {
    const wa = this.cfg.whatsapp;

    if (!wa.otpEnabled) {
      // Feature disabled — silent no-op; SMS path handles delivery.
      return false;
    }

    // Read the token fresh so rotations don't require a redeploy of cached config.
    const accessToken = (this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '') ?? '').trim();
    if (!accessToken || !wa.phoneNumberId) {
      this.logger.warn(
        { hasToken: Boolean(accessToken), hasPhoneNumberId: Boolean(wa.phoneNumberId) },
        'WhatsApp OTP enabled but access token / phone number id missing — falling back to SMS',
      );
      return false;
    }

    const to = this.toWhatsAppNumber(phone);

    // Test-token guard: when a test recipient is configured, only it can receive.
    if (wa.testRecipient) {
      const allowed = this.toWhatsAppNumber(wa.testRecipient);
      if (to !== allowed) {
        this.logger.log(
          { to: this.maskNumber(to) },
          'WhatsApp OTP restricted to the configured test recipient — falling back to SMS for this number',
        );
        return false;
      }
    }

    const url = `https://graph.facebook.com/${wa.graphVersion}/${wa.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: wa.otpTemplateName,
        language: { code: wa.otpTemplateLang },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: code }],
          },
          {
            // The approved 'otp' template uses a URL-type copy-code button
            // (WhatsApp's standard authentication button). Its {{1}} URL variable
            // must be filled with the code as a text parameter. index '0' = the
            // first (and only) button.
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: code }],
          },
        ],
      },
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      });

      const messageId = response.data?.messages?.[0]?.id;
      this.logger.log(
        { to: this.maskNumber(to), messageId, template: wa.otpTemplateName },
        'OTP sent via WhatsApp Cloud API',
      );
      return true;
    } catch (err) {
      // Surface Meta's error body (code/subcode/message) to aid debugging, then fall
      // back to SMS rather than failing the whole OTP request.
      const providerError = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      this.logger.error(
        { to: this.maskNumber(to), providerError },
        'WhatsApp OTP send failed — falling back to SMS',
      );
      return false;
    }
  }

  /**
   * Send a free-form text message and return Meta's message id (`wamid.…`) so the
   * caller can persist and track it. Never throws — failures come back as
   * `{ messageId: null, error, errorCode, httpStatus }`.
   *
   * Meta only delivers business-initiated free-form text within the 24-hour
   * customer-service window; outside it an approved template is required and the
   * send is rejected.
   */
  async sendTextMessage(phone: string, message: string): Promise<WhatsAppSendResult> {
    return this.postMessage(phone, {
      type: 'text',
      text: { preview_url: false, body: message },
    });
  }

  /**
   * Send an approved Meta template. Required for the first outbound message to a
   * customer and for anything outside the 24-hour window.
   *
   * `bodyParams` fill the template's positional body variables ({{1}}, {{2}}, …)
   * in order. Pass an empty array for templates with no variables.
   */
  async sendTemplateMessage(
    phone: string,
    templateName: string,
    languageCode: string,
    bodyParams: string[] = [],
  ): Promise<WhatsAppSendResult> {
    return this.postMessage(phone, {
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(bodyParams.length
          ? {
              components: [
                {
                  type: 'body',
                  parameters: bodyParams.map((text) => ({ type: 'text', text })),
                },
              ],
            }
          : {}),
      },
    });
  }

  /**
   * Single POST to the Cloud API messages endpoint. Never throws: callers get a
   * structured result so a batch send can classify per-recipient failures
   * (retryable throttling vs. permanent bad number vs. fatal token expiry).
   */
  private async postMessage(
    phone: string,
    body: Record<string, unknown>,
  ): Promise<WhatsAppSendResult> {
    const wa = this.cfg.whatsapp;
    const accessToken = (this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '') ?? '').trim();
    if (!accessToken || !wa.phoneNumberId) {
      return { messageId: null, error: 'WhatsApp is not configured' };
    }

    const to = this.toWhatsAppNumber(phone);
    if (wa.testRecipient && to !== this.toWhatsAppNumber(wa.testRecipient)) {
      // On a Meta test token, only the pinned test recipient can receive.
      return { messageId: null, error: 'Recipient is not the pinned WhatsApp test number' };
    }

    const url = `https://graph.facebook.com/${wa.graphVersion}/${wa.phoneNumberId}/messages`;
    try {
      const response = await axios.post<{ messages?: Array<{ id?: string }> }>(
        url,
        { messaging_product: 'whatsapp', to, ...body },
        {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          timeout: 8000,
        },
      );
      const messageId = response.data?.messages?.[0]?.id ?? null;
      this.logger.log({ to: this.maskNumber(to), messageId }, 'WhatsApp message sent');
      return { messageId };
    } catch (err) {
      const axiosError = axios.isAxiosError(err) ? err : undefined;
      const providerError = axiosError?.response?.data?.error as
        | { message?: string; code?: number }
        | undefined;
      this.logger.warn({ to: this.maskNumber(to), providerError }, 'WhatsApp send failed');
      return {
        messageId: null,
        error: providerError?.message ?? axiosError?.message ?? 'WhatsApp rejected the message',
        errorCode: providerError?.code,
        httpStatus: axiosError?.response?.status,
      };
    }
  }

  /**
   * Send a free-form text message (order updates etc.) via WhatsApp Cloud API.
   * Auto-gated: a no-op returning `false` when WhatsApp isn't configured, so it
   * never blocks the order flow.
   */
  async sendText(phone: string, message: string): Promise<boolean> {
    const { messageId } = await this.sendTextMessage(phone, message);
    return Boolean(messageId);
  }

  /** Meta Cloud API expects the number in international format, digits only (no '+'). */
  private toWhatsAppNumber(phone: string): string {
    return (phone ?? '').replace(/[^\d]/g, '');
  }

  private maskNumber(digits: string): string {
    if (digits.length <= 4) return '****';
    return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
  }
}
