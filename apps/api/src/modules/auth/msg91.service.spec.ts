import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Msg91Service } from './msg91.service';
import { createAuthConfigMock } from '../../test/auth-config.mock';
import { SMS_WHATSAPP_DISABLED_LOG } from './auth.constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Msg91Service', () => {
  let service: Msg91Service;

  async function createService(overrides: Record<string, string> = {}) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Msg91Service,
        { provide: ConfigService, useValue: createAuthConfigMock(overrides) },
      ],
    }).compile();
    return module.get(Msg91Service);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not call MSG91 when AUTH_SMS_ENABLED=false', async () => {
    service = await createService({
      MSG91_ENABLED: 'true',
      AUTH_SMS_ENABLED: 'false',
      SMS_PROVIDER: 'msg91',
      MSG91_AUTH_KEY: 'test-key',
      MSG91_TEMPLATE_ID: 'template-1',
    });

    await expect(service.sendOtp('+919876543210', '123456')).resolves.toBeUndefined();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('does not call MSG91 for transactional SMS when AUTH_SMS_ENABLED=false', async () => {
    service = await createService({
      MSG91_ENABLED: 'true',
      AUTH_SMS_ENABLED: 'false',
      SMS_PROVIDER: 'msg91',
    });

    await expect(
      service.sendTransactional('+919876543210', 'Your order is ready'),
    ).resolves.toBeUndefined();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('uses console mode without calling MSG91 API', async () => {
    service = await createService({
      MSG91_ENABLED: 'false',
      AUTH_SMS_ENABLED: 'true',
      SMS_PROVIDER: 'console',
    });

    await expect(service.sendOtp('+919876543210', '123456')).resolves.toBeUndefined();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('calls MSG91 when fully enabled', async () => {
    service = await createService({
      MSG91_ENABLED: 'true',
      AUTH_SMS_ENABLED: 'true',
      SMS_PROVIDER: 'msg91',
      MSG91_AUTH_KEY: 'test-key',
      MSG91_TEMPLATE_ID: 'template-1',
    });

    mockedAxios.post.mockResolvedValue({ data: { type: 'success', message: 'msg-1' } });

    await service.sendOtp('+919876543210', '123456');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.msg91.com/api/v5/otp',
      expect.objectContaining({ mobile: '919876543210', otp: '123456' }),
      expect.any(Object),
    );
  });
});

describe('SMS_WHATSAPP_DISABLED_LOG', () => {
  it('uses the expected log message', () => {
    expect(SMS_WHATSAPP_DISABLED_LOG).toBe('SMS/WhatsApp disabled until provider approval.');
  });
});
