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

  it('renders password reset with link', () => {
    const tpl = service.passwordReset('https://jebdekho.com/forgot-password?token=abc', 15);
    expect(tpl.subject).toBe('Reset Your Password');
    expect(tpl.html).toContain('https://jebdekho.com/forgot-password?token=abc');
  });
});
