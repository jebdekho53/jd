import { OtpPurpose } from '@prisma/client';
import { OtpService } from './otp.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { Msg91Service } from './msg91.service';
import { secureNumericCode } from '../../common/utils/secure-random.util';

jest.mock('../../common/utils/secure-random.util', () => ({
  secureNumericCode: jest.fn(() => '482910'),
}));

describe('OtpService.generateCode', () => {
  it('uses secureNumericCode for OTP generation', async () => {
    const prisma = {
      otpVerification: {
        create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const redis = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn(),
    };
    const configService = {
      get: (key: string, fallback?: unknown) => {
        const map: Record<string, unknown> = {
          OTP_LENGTH: 6,
          OTP_EXPIRES_MINUTES: 5,
          OTP_MAX_ATTEMPTS: 5,
          OTP_RATE_LIMIT_REQUESTS: 3,
          OTP_RATE_LIMIT_WINDOW_MINUTES: 10,
          DEV_DEMO_PHONE: '+919876543210',
          DEV_DEMO_OTP: '123456',
          NODE_ENV: 'test',
        };
        return map[key] ?? fallback;
      },
    };

    const service = new OtpService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
      { sendOtp: jest.fn() } as unknown as Msg91Service,
      configService as ConfigService,
    );

    await service.requestOtp('+919999999999', OtpPurpose.LOGIN);

    expect(secureNumericCode).toHaveBeenCalledWith(6);
  });
});
