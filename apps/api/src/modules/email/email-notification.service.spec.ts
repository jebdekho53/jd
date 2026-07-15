import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailNotificationService } from './email-notification.service';
import { EmailTemplateService } from './email-template.service';
import { EMAIL_TEMPLATE } from './email.constants';
import { PrismaService } from '../../database/prisma.service';

describe('EmailNotificationService', () => {
  const email = { send: jest.fn().mockResolvedValue({ success: true, logId: 'email-log-1' }) };
  const prisma = {
    emailLog: { findFirst: jest.fn().mockResolvedValue(null) },
    order: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'internal-order-id',
        orderNumber: 'JD-1001',
        buyerProfile: { user: { email: 'buyer@example.com' } },
      }),
    },
  };
  const config = {
    get: jest.fn((key: string, fallback?: string) => (key === 'ADMIN_EMAIL' ? 'ops@jebdekho.com' : fallback)),
  };

  let service: EmailNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.emailLog.findFirst.mockResolvedValue(null);
    service = new EmailNotificationService(
      email as unknown as EmailService,
      new EmailTemplateService(),
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
  });

  it('maps buyer payment success to the payment success template with public order number', async () => {
    await service.sendBuyerPaymentSuccess('internal-order-id');

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer@example.com',
        subject: 'Payment Successful - JD-1001',
        templateCode: EMAIL_TEMPLATE.PAYMENT_SUCCESS,
        metadata: { orderNumber: 'JD-1001' },
      }),
    );
    expect(email.send.mock.calls[0][0].subject).not.toContain('internal-order-id');
  });

  it('sends buyer signup welcome with the buyer template code and user metadata', async () => {
    await service.sendBuyerWelcomeEmail('buyer@example.com', 'Rahul', 'user-1');

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer@example.com',
        templateCode: EMAIL_TEMPLATE.WELCOME,
        metadata: { name: 'Rahul', userId: 'user-1' },
      }),
    );
  });

  it('sends merchant signup welcome with the merchant template code and application metadata', async () => {
    await service.sendMerchantWelcomeEmail('merchant@example.com', 'Store Owner', 'app-1');

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'merchant@example.com',
        subject: 'Welcome to JebDekho Merchant',
        templateCode: EMAIL_TEMPLATE.MERCHANT_WELCOME,
        metadata: { name: 'Store Owner', applicationId: 'app-1' },
      }),
    );
  });

  it('sends franchise welcome with referral context and skips missing email', async () => {
    await service.sendFranchiseWelcomeEmail({
      to: null,
      name: 'Partner',
      leadId: 'lead-empty',
      franchiseId: 'fr-empty',
      referralCode: 'FR-GHA-01',
    });
    expect(email.send).not.toHaveBeenCalled();

    await service.sendFranchiseWelcomeEmail({
      to: 'franchise@example.com',
      name: 'Partner',
      leadId: 'lead-1',
      franchiseId: 'fr-1',
      referralCode: 'FR-GHA-01',
    });

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'franchise@example.com',
        subject: 'Welcome to JebDekho Franchise',
        templateCode: EMAIL_TEMPLATE.FRANCHISE_WELCOME,
        metadata: {
          name: 'Partner',
          leadId: 'lead-1',
          franchiseId: 'fr-1',
          referralCode: 'FR-GHA-01',
        },
      }),
    );
    expect(email.send.mock.calls[0][0].text).toContain('FR-GHA-01');
    expect(email.send.mock.calls[0][0].text).toContain('?ref=FR-GHA-01');
  });

  it('sends rider onboarding welcome with the rider template code and skips missing email', async () => {
    await service.sendRiderWelcomeEmail(undefined, 'Rider', 'rp-empty');
    expect(email.send).not.toHaveBeenCalled();

    await service.sendRiderWelcomeEmail('rider@example.com', 'Rider', 'rp-1');

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'rider@example.com',
        subject: 'Welcome to JebDekho Rider',
        templateCode: EMAIL_TEMPLATE.RIDER_WELCOME,
        metadata: { name: 'Rider', riderProfileId: 'rp-1' },
      }),
    );
  });

  it('maps admin support ticket alerts to the admin matrix template', async () => {
    await service.sendAdminSupportTicketCreated('TICKET-7');

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ops@jebdekho.com',
        subject: 'Support ticket created - TICKET-7',
        templateCode: EMAIL_TEMPLATE.ADMIN_SUPPORT_TICKET_CREATED,
      }),
    );
  });

  it('does not send duplicate emails for the same recipient, subject, and template', async () => {
    prisma.emailLog.findFirst.mockResolvedValueOnce({ id: 'existing-log' });

    await service.sendBuyerPaymentSuccess('internal-order-id');

    expect(email.send).not.toHaveBeenCalled();
  });
});
