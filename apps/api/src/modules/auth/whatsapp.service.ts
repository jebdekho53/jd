import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { getConfig } from '../../config/configuration';

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
            // Authentication templates carry a one-tap / copy-code button that must
            // echo the code. index '0' = the first (and only) button.
            type: 'button',
            sub_type: 'copy_code',
            index: '0',
            parameters: [{ type: 'coupon_code', coupon_code: code }],
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

  /** Meta Cloud API expects the number in international format, digits only (no '+'). */
  private toWhatsAppNumber(phone: string): string {
    return (phone ?? '').replace(/[^\d]/g, '');
  }

  private maskNumber(digits: string): string {
    if (digits.length <= 4) return '****';
    return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
  }
}
