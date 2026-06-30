import { EmailTemplateService } from './email-template.service';

describe('EmailTemplateService', () => {
  const service = new EmailTemplateService();

  it('renders OTP template with code', () => {
    const tpl = service.otp('123456', 10);
    expect(tpl.subject).toBe('Your JebDekho Verification Code');
    expect(tpl.html).toContain('123456');
    expect(tpl.text).toContain('123456');
  });

  it('renders welcome template with name', () => {
    const tpl = service.welcome('Rahul');
    expect(tpl.subject).toContain('Welcome');
    expect(tpl.html).toContain('Rahul');
  });

  it('uses the required JebDekho automated footer', () => {
    const tpl = service.welcome('Rahul');
    expect(tpl.html).toContain(
      'This is an automated message from JebDekho. For help, contact support@jebdekho.com.',
    );
  });

  it('renders password reset with link', () => {
    const tpl = service.passwordReset('https://jebdekho.com/forgot-password?token=abc', 15);
    expect(tpl.subject).toBe('Reset Your Password');
    expect(tpl.html).toContain('https://jebdekho.com/forgot-password?token=abc');
  });

  it('renders sanitized matrix event notices without internal infrastructure details', () => {
    const tpl = service.eventNotice({
      subject: 'Payment Successful - JD-1001',
      heading: 'Your payment was successful.',
      referenceLabel: 'Order Number',
      referenceValue: 'JD-1001',
      lines: ['We have received your payment and your order is being processed.'],
    });

    expect(tpl.html).toContain('Payment Successful - JD-1001');
    expect(tpl.html).toContain('Order Number');
    expect(tpl.html).not.toContain('localhost');
    expect(tpl.html).not.toContain('SHADOWFAX_API_URL');
  });
});
