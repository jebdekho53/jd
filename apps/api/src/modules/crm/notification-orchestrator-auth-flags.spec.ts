import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from '@prisma/client';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { Msg91Service } from '../auth/msg91.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { createAuthConfigMock } from '../../test/auth-config.mock';

const mockPrisma = {
  notificationTemplate: { findUnique: jest.fn() },
  notificationPreference: { findFirst: jest.fn(), upsert: jest.fn() },
  user: { findUnique: jest.fn() },
  notification: { create: jest.fn() },
  notificationDelivery: { create: jest.fn(), update: jest.fn() },
};

const mockEmail = { send: jest.fn() };
const mockSms = { sendTransactional: jest.fn() };
const mockPush = { sendGeneric: jest.fn() };

describe('NotificationOrchestratorService auth flags', () => {
  let service: NotificationOrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationOrchestratorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmail },
        { provide: Msg91Service, useValue: mockSms },
        { provide: BuyerPushNotificationService, useValue: mockPush },
        {
          provide: ConfigService,
          useValue: createAuthConfigMock({
            AUTH_SMS_ENABLED: 'false',
            AUTH_WHATSAPP_ENABLED: 'false',
          }),
        },
      ],
    }).compile();

    service = module.get(NotificationOrchestratorService);
    jest.clearAllMocks();

    mockPrisma.notificationTemplate.findUnique.mockResolvedValue({
      id: 'tpl-1',
      code: 'ORDER_UPDATE',
      name: 'Order update',
      body: 'Hello',
      subject: 'Update',
      category: 'ORDERS',
      isActive: true,
    });
    mockPrisma.notificationPreference.upsert.mockResolvedValue({
      marketingConsent: true,
      smsEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
      whatsappEnabled: true,
    });
    mockPrisma.notificationPreference.findFirst.mockResolvedValue(null);
  });

  it('skips SMS when AUTH_SMS_ENABLED=false', async () => {
    const result = await service.send({
      userId: 'user-1',
      channel: NotificationChannel.SMS,
      templateCode: 'ORDER_UPDATE',
    });

    expect(result).toEqual({ skipped: true, reason: 'sms_disabled' });
    expect(mockSms.sendTransactional).not.toHaveBeenCalled();
  });

  it('skips WhatsApp when AUTH_WHATSAPP_ENABLED=false', async () => {
    const result = await service.send({
      userId: 'user-1',
      channel: NotificationChannel.WHATSAPP,
      templateCode: 'ORDER_UPDATE',
    });

    expect(result).toEqual({ skipped: true, reason: 'whatsapp_disabled' });
    expect(mockSms.sendTransactional).not.toHaveBeenCalled();
  });
});
