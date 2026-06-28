import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { getConfig } from '../../config/configuration';
import { SMS_WHATSAPP_DISABLED_LOG } from './auth.constants';

@Injectable()
export class Msg91Service {
  private readonly logger = new Logger(Msg91Service.name);
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(private readonly configService: ConfigService) {
    this.cfg = getConfig(configService);
  }

  /**
   * Send an OTP SMS to a phone number.
   * Falls back to console logging when SMS_PROVIDER=console (dev/test).
   */
  async sendOtp(phone: string, otp: string): Promise<void> {
    if (!this.cfg.auth.smsEnabled) {
      this.logger.log({ phone }, SMS_WHATSAPP_DISABLED_LOG);
      return;
    }

    if (this.cfg.sms.provider === 'console') {
      this.logger.log(
        { phone, otp },
        '🔑 OTP (console mode — NOT sent via SMS)',
      );
      return;
    }

    if (!this.cfg.auth.msg91Enabled) {
      this.logger.log({ phone }, SMS_WHATSAPP_DISABLED_LOG);
      return;
    }

    await this.sendViaMSG91(phone, otp);
  }

  /** Transactional SMS (order updates, alerts). Uses MSG91 flow API in production. */
  async sendTransactional(phone: string, message: string): Promise<void> {
    if (!this.cfg.auth.smsEnabled) {
      this.logger.log({ phone, message }, SMS_WHATSAPP_DISABLED_LOG);
      return;
    }

    if (this.cfg.sms.provider === 'console') {
      this.logger.log({ phone, message }, 'SMS (console mode)');
      return;
    }

    if (!this.cfg.auth.msg91Enabled) {
      this.logger.log({ phone, message }, SMS_WHATSAPP_DISABLED_LOG);
      return;
    }

    const mobile = phone.startsWith('+') ? phone.slice(1) : phone;
    const { authKey, senderId } = this.cfg.sms.msg91;

    try {
      const response = await axios.post(
        'https://control.msg91.com/api/v5/flow/',
        {
          template_id: this.cfg.sms.msg91.templateId,
          short_url: '0',
          recipients: [{ mobiles: mobile, var: message }],
        },
        {
          headers: {
            authkey: authKey,
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          timeout: 8000,
        },
      );

      if (response.data?.type === 'error') {
        throw new Error(`MSG91 flow error: ${JSON.stringify(response.data)}`);
      }

      this.logger.log({ mobile }, 'Transactional SMS queued via MSG91');
    } catch (err) {
      this.logger.error({ err, mobile }, 'Failed to send transactional SMS');
      throw new Error('Failed to send SMS notification');
    }
  }

  private async sendViaMSG91(phone: string, otp: string): Promise<void> {
    const { authKey, senderId, templateId, dltTeId } = this.cfg.sms.msg91;

    // Strip '+' prefix — MSG91 expects mobile number without +
    const mobile = phone.startsWith('+') ? phone.slice(1) : phone;

    const payload: Record<string, string> = {
      template_id: templateId,
      mobile,
      otp,
    };

    if (dltTeId) {
      payload['DLT_TE_ID'] = dltTeId;
    }

    try {
      const response = await axios.post(
        'https://api.msg91.com/api/v5/otp',
        payload,
        {
          headers: {
            authkey: authKey,
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          timeout: 8000,
        },
      );

      if (response.data?.type !== 'success') {
        throw new Error(`MSG91 returned non-success: ${JSON.stringify(response.data)}`);
      }

      this.logger.log({ mobile, msgId: response.data?.message }, 'OTP sent via MSG91');
    } catch (err) {
      this.logger.error(
        { err, mobile },
        'Failed to send OTP via MSG91',
      );
      throw new Error('Failed to send OTP. Please try again.');
    }
  }
}
