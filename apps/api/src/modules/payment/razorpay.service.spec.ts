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

  describe('Razorpay Route', () => {
    const liveKeys = {
      RAZORPAY_KEY_ID: 'rzp_test_key',
      RAZORPAY_KEY_SECRET: 'secret',
      RAZORPAY_WEBHOOK_SECRET: 'whsec',
    };

    it('isRouteEnabled is false unless RAZORPAY_ROUTE_ENABLED is set', () => {
      const off = createService(liveKeys);
      off.onModuleInit();
      expect(off.isRouteEnabled()).toBe(false);

      const on = createService({ ...liveKeys, RAZORPAY_ROUTE_ENABLED: 'true' });
      on.onModuleInit();
      expect(on.isRouteEnabled()).toBe(true);
    });

    it('createTransfer refuses when Route is disabled', async () => {
      const service = createService(liveKeys);
      service.onModuleInit();
      await expect(
        service.createTransfer({ linkedAccountId: 'acc_1', amountRupees: 100 }),
      ).rejects.toThrow(/Route is not enabled/);
    });

    it('createTransfer posts amount in paise to the linked account', async () => {
      const service = createService({ ...liveKeys, RAZORPAY_ROUTE_ENABLED: 'true' });
      service.onModuleInit();
      const post = jest
        .fn()
        .mockResolvedValue({ data: { id: 'trf_1', status: 'processed', amount: 15000 } });
      (service as unknown as { route: { post: jest.Mock } }).route = { post } as never;

      const result = await service.createTransfer({
        linkedAccountId: 'acc_ABC',
        amountRupees: 150,
        notes: { payoutRequestId: 'po_1' },
      });

      expect(post).toHaveBeenCalledWith(
        '/v1/transfers',
        expect.objectContaining({ account: 'acc_ABC', amount: 15000, currency: 'INR' }),
      );
      expect(result).toEqual({ id: 'trf_1', status: 'processed', amount: 15000 });
    });

    it('surfaces the Razorpay error description on failure', async () => {
      const service = createService({ ...liveKeys, RAZORPAY_ROUTE_ENABLED: 'true' });
      service.onModuleInit();
      const post = jest.fn().mockRejectedValue({
        response: { status: 400, data: { error: { description: 'The account is not activated' } } },
      });
      (service as unknown as { route: { post: jest.Mock } }).route = { post } as never;

      await expect(
        service.createTransfer({ linkedAccountId: 'acc_ABC', amountRupees: 150 }),
      ).rejects.toThrow(/The account is not activated/);
    });
  });
});
