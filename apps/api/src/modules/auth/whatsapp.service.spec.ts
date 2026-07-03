import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhatsAppService } from './whatsapp.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const base: Record<string, string> = {
    NODE_ENV: 'test',
    ENABLE_WHATSAPP_OTP: 'false',
    WHATSAPP_ACCESS_TOKEN: 'test-token',
    WHATSAPP_PHONE_NUMBER_ID: '1273761169154036',
    WHATSAPP_TEST_RECIPIENT_NUMBER: '+919984412354',
    WHATSAPP_GRAPH_VERSION: 'v21.0',
    WHATSAPP_OTP_TEMPLATE_NAME: 'otp',
    WHATSAPP_OTP_TEMPLATE_LANG: 'en_US',
    ...overrides,
  };
  return {
    get: (key: string, fallback?: unknown) => base[key] ?? fallback,
  } as unknown as ConfigService;
}

describe('WhatsAppService.sendOtp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is a no-op returning false when ENABLE_WHATSAPP_OTP is off', async () => {
    const svc = new WhatsAppService(makeConfig({ ENABLE_WHATSAPP_OTP: 'false' }));
    await expect(svc.sendOtp('+919984412354', '123456')).resolves.toBe(false);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('returns false (no send) for a non-test-recipient while a test recipient is set', async () => {
    const svc = new WhatsAppService(makeConfig({ ENABLE_WHATSAPP_OTP: 'true' }));
    await expect(svc.sendOtp('+919000000000', '123456')).resolves.toBe(false);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('returns false when enabled but access token is missing', async () => {
    const svc = new WhatsAppService(
      makeConfig({ ENABLE_WHATSAPP_OTP: 'true', WHATSAPP_ACCESS_TOKEN: '' }),
    );
    await expect(svc.sendOtp('+919984412354', '123456')).resolves.toBe(false);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('sends the template to the test recipient and returns true', async () => {
    mockedAxios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.test' }] } });
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn();
    const svc = new WhatsAppService(makeConfig({ ENABLE_WHATSAPP_OTP: 'true' }));

    await expect(svc.sendOtp('+91 99844 12354', '654321')).resolves.toBe(true);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    const [url, payload, opts] = mockedAxios.post.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/1273761169154036/messages');
    expect(payload).toMatchObject({
      messaging_product: 'whatsapp',
      to: '919984412354', // digits only, no '+' / spaces
      type: 'template',
      template: { name: 'otp', language: { code: 'en_US' } },
    });
    expect((payload as any).template.components[0].parameters[0].text).toBe('654321');
    expect((opts as any).headers.Authorization).toBe('Bearer test-token');
  });

  it('returns false (falls back to SMS) when the Graph API call fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network'));
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
    const svc = new WhatsAppService(makeConfig({ ENABLE_WHATSAPP_OTP: 'true' }));
    await expect(svc.sendOtp('+919984412354', '123456')).resolves.toBe(false);
  });

  it('sends to any number when no test recipient is configured (production token)', async () => {
    mockedAxios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.prod' }] } });
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn();
    const svc = new WhatsAppService(
      makeConfig({ ENABLE_WHATSAPP_OTP: 'true', WHATSAPP_TEST_RECIPIENT_NUMBER: '' }),
    );
    await expect(svc.sendOtp('+919000000000', '111222')).resolves.toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
