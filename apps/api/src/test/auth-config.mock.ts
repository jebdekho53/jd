import { ConfigService } from '@nestjs/config';

/** ConfigService mock for auth feature-flag tests. */
export function createAuthConfigMock(
  overrides: Record<string, string> = {},
): Pick<ConfigService, 'get'> {
  const defaults: Record<string, string> = {
    NODE_ENV: 'test',
    AUTH_EMAIL_ENABLED: 'true',
    AUTH_PHONE_OTP_ENABLED: 'true',
    AUTH_SMS_ENABLED: 'true',
    AUTH_WHATSAPP_ENABLED: 'false',
    MSG91_ENABLED: 'false',
    SMS_PROVIDER: 'console',
    JWT_PRIVATE_KEY: '',
    JWT_PUBLIC_KEY: '',
  };

  return {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key in overrides) return overrides[key];
      if (key in defaults) return defaults[key];
      return defaultValue;
    }),
  };
}
