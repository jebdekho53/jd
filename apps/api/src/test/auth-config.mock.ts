import { ConfigService } from '@nestjs/config';

/** ConfigService mock for auth feature-flag tests. */
export function createAuthConfigMock(
  overrides: Record<string, string> = {},
): Pick<ConfigService, 'get'> {
  const defaults: Record<string, string> = {
    NODE_ENV: 'test',
    AUTH_EMAIL_ENABLED: 'true',
    // Phone OTP + WhatsApp now auto-enable on WhatsApp Cloud API config (MSG91
    // retired). Provide credentials by default so the "enabled" path is
    // exercised; the disabled path is tested by overriding these to ''.
    ENABLE_WHATSAPP_OTP: 'true',
    WHATSAPP_ACCESS_TOKEN: 'test-wa-token',
    WHATSAPP_PHONE_NUMBER_ID: 'test-wa-phone-id',
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
