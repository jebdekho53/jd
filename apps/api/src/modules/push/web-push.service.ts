import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { getConfig } from '../../config/configuration';

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private configured = false;
  private publicKey = '';
  private subject = 'mailto:support@jebdekho.com';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const publicKey = this.configService.get<string>('WEB_PUSH_PUBLIC_KEY', '');
    const privateKey = this.configService.get<string>('WEB_PUSH_PRIVATE_KEY', '');
    this.subject = this.configService.get<string>(
      'WEB_PUSH_SUBJECT',
      'mailto:support@jebdekho.com',
    );
    this.publicKey = publicKey;

    if (publicKey && privateKey) {
      webpush.setVapidDetails(this.subject, publicKey, privateKey);
      this.configured = true;
      this.logger.log('Web Push VAPID configured');
    } else {
      this.logger.warn('Web Push not configured — missing WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY');
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  async send(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: string,
  ): Promise<{ statusCode: number }> {
    if (!this.configured) {
      return { statusCode: 503 };
    }

    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
    );

    return { statusCode: result.statusCode };
  }
}
