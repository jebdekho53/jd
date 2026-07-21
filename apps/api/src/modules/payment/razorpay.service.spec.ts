import * as crypto from 'crypto';
import { RazorpayService } from './razorpay.service';

/**
 * Minimal ConfigService stub. getConfig() reads many keys with defaults, so we
 * only override the Razorpay secrets and let everything else fall through to the
 * supplied default argument.
 */
function makeService(overrides: Record<string, unknown>): RazorpayService {
  const config = {
    get: <T>(key: string, def?: T): T =>
      (key in overrides ? (overrides[key] as T) : (def as T)),
  };
  return new RazorpayService(config as never);
}

const KEY_SECRET = 'test_key_secret_abc123';
const WEBHOOK_SECRET = 'test_webhook_secret_xyz789';

describe('RazorpayService.verifyPaymentSignature', () => {
  const svc = makeService({
    RAZORPAY_KEY_ID: 'rzp_test_x',
    RAZORPAY_KEY_SECRET: KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
  });

  const orderId = 'order_ABC';
  const paymentId = 'pay_XYZ';
  const validSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  it('accepts a correctly signed payment', () => {
    expect(svc.verifyPaymentSignature(orderId, paymentId, validSignature)).toBe(true);
  });

  it('rejects a tampered signature', () => {
    expect(svc.verifyPaymentSignature(orderId, paymentId, validSignature.replace(/.$/, '0'))).toBe(
      false,
    );
  });

  it('rejects when order/payment id is swapped (replay across orders)', () => {
    expect(svc.verifyPaymentSignature('order_OTHER', paymentId, validSignature)).toBe(false);
  });

  it('rejects an empty or malformed signature', () => {
    expect(svc.verifyPaymentSignature(orderId, paymentId, '')).toBe(false);
    expect(svc.verifyPaymentSignature(orderId, paymentId, 'not-hex')).toBe(false);
  });
});

describe('RazorpayService.verifyWebhookSignature', () => {
  const svc = makeService({
    RAZORPAY_KEY_ID: 'rzp_test_x',
    RAZORPAY_KEY_SECRET: KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
  });

  const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured', id: 'evt_1' }));
  const validSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  it('accepts a webhook signed with the webhook secret', () => {
    expect(svc.verifyWebhookSignature(rawBody, validSignature)).toBe(true);
  });

  it('rejects a body that was altered after signing', () => {
    const tampered = Buffer.from(JSON.stringify({ event: 'payment.captured', id: 'evt_HACKED' }));
    expect(svc.verifyWebhookSignature(tampered, validSignature)).toBe(false);
  });

  it('rejects a signature made with the wrong secret', () => {
    const forged = crypto.createHmac('sha256', 'wrong-secret').update(rawBody).digest('hex');
    expect(svc.verifyWebhookSignature(rawBody, forged)).toBe(false);
  });
});

describe('RazorpayService signature checks fail closed when unconfigured', () => {
  const svc = makeService({}); // no secrets

  it('rejects everything when no key secret is set', () => {
    expect(svc.verifyPaymentSignature('o', 'p', 'anything')).toBe(false);
  });

  it('rejects everything when no webhook secret is set', () => {
    expect(svc.verifyWebhookSignature(Buffer.from('x'), 'anything')).toBe(false);
  });
});
