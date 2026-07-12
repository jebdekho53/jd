import { ConfigService } from '@nestjs/config';
import { WhatsAppBroadcastMode, WhatsAppBroadcastStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService, type WhatsAppSendResult } from '../auth/whatsapp.service';
import { WhatsAppInboxService } from '../whatsapp-inbox/whatsapp-inbox.service';
import { WhatsAppBroadcastService } from './whatsapp-broadcast.service';

const BROADCAST = {
  id: 'bc_1',
  mode: WhatsAppBroadcastMode.TEXT,
  bodyTemplate: 'Hi {{name}}, we miss you!',
  templateName: null,
  templateLang: null,
  templateParams: [] as string[],
};

const RECIPIENTS = [
  { id: 'r1', waId: '919000000001', fields: { name: 'Aisha' }, createdAt: new Date(1) },
  { id: 'r2', waId: '919000000002', fields: { name: 'Bharat' }, createdAt: new Date(2) },
  { id: 'r3', waId: '919000000003', fields: { name: 'Chetan' }, createdAt: new Date(3) },
];

function build(sendResults: WhatsAppSendResult[]) {
  const recipientUpdates: Array<{ id: string; data: Record<string, unknown> }> = [];
  const broadcastUpdates: Array<Record<string, unknown>> = [];

  const prisma = {
    whatsAppBroadcast: {
      findUnique: jest.fn().mockResolvedValue(BROADCAST),
      update: jest.fn(({ data }) => {
        broadcastUpdates.push(data);
        return Promise.resolve({ ...BROADCAST, ...data });
      }),
    },
    whatsAppBroadcastRecipient: {
      findMany: jest.fn().mockResolvedValue(RECIPIENTS),
      update: jest.fn(({ where, data }) => {
        recipientUpdates.push({ id: where.id, data });
        return Promise.resolve({});
      }),
    },
  };

  const sendTextMessage = jest.fn();
  sendResults.forEach((result) => sendTextMessage.mockResolvedValueOnce(result));
  // Anything beyond the scripted results would be an unexpected extra send.
  sendTextMessage.mockResolvedValue({ messageId: null, error: 'unexpected extra send', errorCode: 999 });

  const whatsapp = { sendTextMessage, sendTemplateMessage: jest.fn() } as unknown as WhatsAppService;
  const inbox = { recordOutboundMessage: jest.fn().mockResolvedValue(undefined) } as unknown as WhatsAppInboxService;
  const configService = {
    get: <T>(key: string, fallback?: T) =>
      (({ WHATSAPP_PHONE_NUMBER_ID: '1100578429815428' }) as Record<string, unknown>)[key] ?? fallback,
  } as unknown as ConfigService;

  const service = new WhatsAppBroadcastService(
    prisma as unknown as PrismaService,
    configService,
    whatsapp,
    inbox,
  );

  return { service, prisma, whatsapp, inbox, sendTextMessage, recipientUpdates, broadcastUpdates };
}

const finalUpdate = (updates: Array<Record<string, unknown>>) => updates[updates.length - 1];

describe('WhatsAppBroadcastService.run', () => {
  it('personalizes each message and mirrors sends into the inbox', async () => {
    const { service, sendTextMessage, inbox, broadcastUpdates } = build([
      { messageId: 'wamid.1' },
      { messageId: 'wamid.2' },
      { messageId: 'wamid.3' },
    ]);

    await service.run('bc_1', 1000);

    expect(sendTextMessage.mock.calls.map(([waId, text]) => [waId, text])).toEqual([
      ['919000000001', 'Hi Aisha, we miss you!'],
      ['919000000002', 'Hi Bharat, we miss you!'],
      ['919000000003', 'Hi Chetan, we miss you!'],
    ]);
    expect(inbox.recordOutboundMessage).toHaveBeenCalledTimes(3);
    expect(finalUpdate(broadcastUpdates)).toMatchObject({
      status: WhatsAppBroadcastStatus.COMPLETED,
      sentCount: 3,
      failedCount: 0,
      errorMessage: null,
    });
  });

  it('records a per-recipient failure and keeps going', async () => {
    const { service, sendTextMessage, recipientUpdates, broadcastUpdates } = build([
      { messageId: 'wamid.1' },
      { messageId: null, error: 'Recipient phone number not valid', errorCode: 131026 },
      { messageId: 'wamid.3' },
    ]);

    await service.run('bc_1', 1000);

    expect(sendTextMessage).toHaveBeenCalledTimes(3);
    expect(recipientUpdates[1]).toEqual({
      id: 'r2',
      data: expect.objectContaining({
        status: 'FAILED',
        errorCode: 131026,
        errorMessage: 'Recipient phone number not valid',
        attempts: 1,
      }),
    });
    expect(finalUpdate(broadcastUpdates)).toMatchObject({
      status: WhatsAppBroadcastStatus.COMPLETED,
      sentCount: 2,
      failedCount: 1,
    });
  });

  it('retries a throttled send with backoff, then succeeds', async () => {
    const { service, sendTextMessage, recipientUpdates } = build([
      { messageId: null, error: 'Rate limit hit', errorCode: 80007 },
      { messageId: 'wamid.1' },
      { messageId: 'wamid.2' },
      { messageId: 'wamid.3' },
    ]);

    await service.run('bc_1', 1000);

    expect(sendTextMessage).toHaveBeenCalledTimes(4);
    expect(recipientUpdates[0]).toEqual({
      id: 'r1',
      data: expect.objectContaining({ status: 'SENT', attempts: 2, waMessageId: 'wamid.1' }),
    });
  }, 15_000);

  it('aborts the whole batch when the access token has expired', async () => {
    const { service, sendTextMessage, broadcastUpdates } = build([
      { messageId: 'wamid.1' },
      { messageId: null, error: 'Session has expired', errorCode: 190 },
    ]);

    await service.run('bc_1', 1000);

    // Stops at recipient 2 — recipient 3 is never attempted.
    expect(sendTextMessage).toHaveBeenCalledTimes(2);
    expect(finalUpdate(broadcastUpdates)).toMatchObject({
      status: WhatsAppBroadcastStatus.FAILED,
      errorMessage: 'Session has expired',
      sentCount: 1,
    });
  });
});
