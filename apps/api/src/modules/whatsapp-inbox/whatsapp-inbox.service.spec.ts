import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHmac } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService } from '../auth/whatsapp.service';
import { WhatsAppInboxService, WhatsAppWebhookPayload } from './whatsapp-inbox.service';

const APP_SECRET = 'test_app_secret';
const VERIFY_TOKEN = 'test_verify_token';

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const env: Record<string, string> = {
    WHATSAPP_APP_SECRET: APP_SECRET,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: '1100578429815428',
    ...overrides,
  };
  return {
    get: <T>(key: string, fallback?: T) => (env[key] as unknown as T) ?? fallback,
  } as unknown as ConfigService;
}

function makePrisma() {
  return {
    whatsAppMessage: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'msg_1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    whatsAppConversation: {
      upsert: jest.fn().mockResolvedValue({ id: 'conv_1', waId: '919984412354' }),
    },
  };
}

function build(overrides: Record<string, string> = {}) {
  const prisma = makePrisma();
  const whatsapp = {
    sendTextMessage: jest.fn(),
    downloadMedia: jest.fn(),
  } as unknown as WhatsAppService;
  const events = { emit: jest.fn() } as unknown as EventEmitter2;
  const service = new WhatsAppInboxService(
    prisma as unknown as PrismaService,
    makeConfig(overrides),
    whatsapp,
    events,
  );
  return { service, prisma, whatsapp, events };
}

describe('WhatsAppInboxService.getMessageMedia', () => {
  it('reads the media id from the stored payload and downloads it', async () => {
    const { service, prisma, whatsapp } = build();
    (prisma.whatsAppMessage.findUnique as jest.Mock).mockResolvedValue({
      id: 'msg_1',
      type: 'image',
      payload: { image: { id: 'media_123', mime_type: 'image/jpeg' } },
    });
    (whatsapp.downloadMedia as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('img'),
      contentType: 'image/jpeg',
    });

    const result = await service.getMessageMedia('msg_1');

    expect(whatsapp.downloadMedia).toHaveBeenCalledWith('media_123');
    expect(result.contentType).toBe('image/jpeg');
  });

  it('returns the document filename for downloads', async () => {
    const { service, prisma, whatsapp } = build();
    (prisma.whatsAppMessage.findUnique as jest.Mock).mockResolvedValue({
      id: 'msg_2',
      type: 'document',
      payload: { document: { id: 'media_9', filename: 'invoice.pdf' } },
    });
    (whatsapp.downloadMedia as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('%PDF'),
      contentType: 'application/pdf',
    });

    const result = await service.getMessageMedia('msg_2');
    expect(result.filename).toBe('invoice.pdf');
  });

  it('throws when the message carries no media', async () => {
    const { service, prisma } = build();
    (prisma.whatsAppMessage.findUnique as jest.Mock).mockResolvedValue({
      id: 'msg_3',
      type: 'text',
      payload: { text: { body: 'hi' } },
    });
    await expect(service.getMessageMedia('msg_3')).rejects.toThrow(/no downloadable media/);
  });
});

function textPayload(waMessageId: string): WhatsAppWebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '995003660095146',
        changes: [
          {
            field: 'messages',
            value: {
              metadata: { display_phone_number: '911234567890', phone_number_id: '1100578429815428' },
              contacts: [{ wa_id: '919984412354', profile: { name: 'Rahul' } }],
              messages: [
                {
                  id: waMessageId,
                  from: '919984412354',
                  timestamp: '1770000000',
                  type: 'text',
                  text: { body: 'Order kab aayega?' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('WhatsAppInboxService', () => {
  describe('isValidVerifyToken', () => {
    it('accepts the configured token on a subscribe handshake', () => {
      const { service } = build();
      expect(service.isValidVerifyToken('subscribe', VERIFY_TOKEN)).toBe(true);
    });

    it('rejects a wrong token, a wrong mode, and a missing token', () => {
      const { service } = build();
      expect(service.isValidVerifyToken('subscribe', 'nope')).toBe(false);
      expect(service.isValidVerifyToken('unsubscribe', VERIFY_TOKEN)).toBe(false);
      expect(service.isValidVerifyToken('subscribe', undefined)).toBe(false);
    });

    it('rejects everything when no verify token is configured', () => {
      const { service } = build({ WHATSAPP_WEBHOOK_VERIFY_TOKEN: '' });
      expect(service.isValidVerifyToken('subscribe', '')).toBe(false);
    });
  });

  describe('verifySignature', () => {
    const body = Buffer.from(JSON.stringify({ hello: 'world' }));
    const validHeader = `sha256=${createHmac('sha256', APP_SECRET).update(body).digest('hex')}`;

    it('accepts a signature computed over the exact raw body', () => {
      const { service } = build();
      expect(service.verifySignature(body, validHeader)).toEqual({ valid: true, skipped: false });
    });

    it('rejects a tampered body', () => {
      const { service } = build();
      const tampered = Buffer.from(JSON.stringify({ hello: 'evil' }));
      expect(service.verifySignature(tampered, validHeader).valid).toBe(false);
    });

    it('rejects a missing, malformed, or wrong-length signature', () => {
      const { service } = build();
      expect(service.verifySignature(body, undefined).valid).toBe(false);
      expect(service.verifySignature(body, 'sha1=abc').valid).toBe(false);
      expect(service.verifySignature(body, 'sha256=deadbeef').valid).toBe(false);
    });

    it('skips verification (and says so) when no app secret is configured', () => {
      const { service } = build({ WHATSAPP_APP_SECRET: '' });
      expect(service.verifySignature(body, undefined)).toEqual({ valid: true, skipped: true });
    });
  });

  describe('processWebhook', () => {
    function typedPayload(type: string, extra: Record<string, unknown>) {
      return {
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  metadata: { display_phone_number: '911234567890', phone_number_id: '1100578429815428' },
                  messages: [
                    { id: `wamid.${type}`, from: '919984412354', timestamp: '1770000000', type, ...extra },
                  ],
                },
              },
            ],
          },
        ],
      };
    }

    const previewOf = async (type: string, extra: Record<string, unknown>) => {
      const { service, prisma } = build();
      await service.processWebhook(typedPayload(type, extra));
      return prisma.whatsAppConversation.upsert.mock.calls[0]?.[0]?.create?.lastMessageText as string;
    };

    it('labels media, reactions, and unsupported messages instead of hiding them', async () => {
      expect(await previewOf('image', { image: {} })).toBe('📷 Photo');
      expect(await previewOf('audio', { audio: { voice: true } })).toBe('🎤 Voice message');
      expect(await previewOf('location', { location: { name: 'Home' } })).toBe('📍 Home');
      expect(await previewOf('reaction', { reaction: { emoji: '❤️' } })).toBe('Reacted ❤️');
      expect(
        await previewOf('unsupported', {
          errors: [{ title: 'Unsupported message type', error_data: { details: 'Message type is not currently supported' } }],
        }),
      ).toBe('⚠️ Unsupported message — Message type is not currently supported');
    });

    it('stores an inbound text message and bumps the conversation unread count', async () => {
      const { service, prisma } = build();

      const result = await service.processWebhook(textPayload('wamid.abc'));

      expect(result).toEqual({ messages: 1, statuses: 0 });
      expect(prisma.whatsAppConversation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { waId: '919984412354' },
          update: expect.objectContaining({
            lastMessageText: 'Order kab aayega?',
            unreadCount: { increment: 1 },
          }),
        }),
      );
      expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            waMessageId: 'wamid.abc',
            direction: 'INBOUND',
            text: 'Order kab aayega?',
            timestamp: new Date(1770000000 * 1000),
          }),
        }),
      );
    });

    it('is idempotent: a redelivered message id is skipped', async () => {
      const { service, prisma, events } = build();
      prisma.whatsAppMessage.findUnique.mockResolvedValue({ id: 'msg_1' });

      const result = await service.processWebhook(textPayload('wamid.abc'));

      expect(result).toEqual({ messages: 0, statuses: 0 });
      expect(prisma.whatsAppMessage.create).not.toHaveBeenCalled();
      expect(prisma.whatsAppConversation.upsert).not.toHaveBeenCalled();
      // A duplicate must not re-notify the live admin inbox.
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('emits a real-time event for a newly stored inbound message', async () => {
      const { service, events } = build();

      await service.processWebhook(textPayload('wamid.abc'));

      expect(events.emit).toHaveBeenCalledWith('whatsapp.message.received', {
        conversationId: 'conv_1',
        waId: '919984412354',
        displayName: 'Rahul',
        text: 'Order kab aayega?',
        timestamp: new Date(1770000000 * 1000).toISOString(),
      });
    });

    it('emits a real-time event when a delivery status matches a message', async () => {
      const { service, events } = build();

      await service.processWebhook({
        entry: [
          {
            changes: [
              { field: 'messages', value: { statuses: [{ id: 'wamid.out', status: 'read' }] } },
            ],
          },
        ],
      });

      expect(events.emit).toHaveBeenCalledWith('whatsapp.message.status', {
        waMessageId: 'wamid.out',
        status: 'read',
      });
    });

    it('does not emit a status event when no message matches', async () => {
      const { service, prisma, events } = build();
      prisma.whatsAppMessage.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.processWebhook({
        entry: [
          {
            changes: [
              { field: 'messages', value: { statuses: [{ id: 'wamid.unknown', status: 'sent' }] } },
            ],
          },
        ],
      });

      expect(result).toEqual({ messages: 0, statuses: 0 });
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('applies delivery status updates to the matching outbound message', async () => {
      const { service, prisma } = build();

      const result = await service.processWebhook({
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: { statuses: [{ id: 'wamid.out', status: 'delivered', recipient_id: '91998' }] },
              },
            ],
          },
        ],
      });

      expect(result).toEqual({ messages: 0, statuses: 1 });
      expect(prisma.whatsAppMessage.updateMany).toHaveBeenCalledWith({
        where: { waMessageId: 'wamid.out' },
        data: { status: 'delivered', errorPayload: undefined },
      });
    });

    it('ignores changes for fields other than `messages`', async () => {
      const { service, prisma } = build();

      const result = await service.processWebhook({
        entry: [{ changes: [{ field: 'message_template_status_update', value: {} }] }],
      });

      expect(result).toEqual({ messages: 0, statuses: 0 });
      expect(prisma.whatsAppMessage.create).not.toHaveBeenCalled();
    });
  });
});
