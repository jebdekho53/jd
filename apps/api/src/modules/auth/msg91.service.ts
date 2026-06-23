import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { getConfig } from '../../config/configuration';

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
    if (this.cfg.sms.provider === 'console') {
      this.logger.log(
        { phone, otp },
        '🔑 OTP (console mode — NOT sent via SMS)',
      );
      return;
    }

    await this.sendViaMSG91(phone, otp);
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
