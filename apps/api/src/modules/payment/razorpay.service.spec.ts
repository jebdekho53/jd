import { ConfigService } from '@nestjs/config';
import { RazorpayService } from './razorpay.service';
import * as crypto from 'crypto';

describe('RazorpayService', () => {
  const createService = (env: Record<string, string>) => {
    const config = {
      get: (key: string, fallback = '') => env[key] ?? fallback,
    } as ConfigService;
    return new RazorpayService(config);
  };

  it('verifyWebhookSignature returns false when webhook secret is empty', () => {
    const service = createService({});
    const body = Buffer.from('{"event":"payment.captured"}');
    expect(service.verifyWebhookSignature(body, 'abc')).toBe(false);
  });

  it('verifyWebhookSignature validates HMAC with secret', () => {
    const secret = 'whsec_test';
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const service = createService({ RAZORPAY_WEBHOOK_SECRET: secret });
    expect(service.verifyWebhookSignature(body, signature)).toBe(true);
    expect(service.verifyWebhookSignature(body, 'deadbeef')).toBe(false);
  });

  it('verifyPaymentSignature returns false for malformed hex signature', () => {
    const service = createService({ RAZORPAY_KEY_SECRET: 'key_secret' });
    expect(
      service.verifyPaymentSignature('order_1', 'pay_1', 'not-valid-hex'),
    ).toBe(false);
  });

  it('verifyPaymentSignature validates payment HMAC', () => {
    const keySecret = 'key_secret';
    const orderId = 'order_abc';
    const paymentId = 'pay_xyz';
    const payload = `${orderId}|${paymentId}`;
    const signature = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');
    const service = createService({ RAZORPAY_KEY_SECRET: keySecret });
    expect(service.verifyPaymentSignature(orderId, paymentId, signature)).toBe(true);
  });

  it('throws onModuleInit in production without webhook secret when keys configured', () => {
    const service = createService({
      NODE_ENV: 'production',
      RAZORPAY_KEY_ID: 'rzp_live',
      RAZORPAY_KEY_SECRET: 'secret',
      RAZORPAY_WEBHOOK_SECRET: '',
    });
    expect(() => service.onModuleInit()).toThrow(/RAZORPAY_WEBHOOK_SECRET/);
  });
});
