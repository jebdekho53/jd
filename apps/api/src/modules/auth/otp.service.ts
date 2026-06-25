import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS, REDIS_TTL } from '../../redis/redis.constants';
import { getConfig } from '../../config/configuration';
import { isDemoPhone } from '../../common/utils/demo-auth.util';
import { Msg91Service } from './msg91.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly msg91: Msg91Service,
    private readonly configService: ConfigService,
  ) {
    this.cfg = getConfig(configService);
  }

  /**
   * Generate, store (hashed), and dispatch an OTP for the given phone number.
   * Rate-limits: max 3 requests per phone per 10 minutes (Redis counter).
   */
  async requestOtp(
    phone: string,
    purpose: OtpPurpose,
    userId?: string,
  ): Promise<{ expiresIn: number }> {
    if (!isDemoPhone(phone, this.cfg)) {
      await this.enforceRateLimit(phone);
    }

    const code = this.resolveOtpCode(phone);
    const codeHash = await argon2.hash(code, {
      type: argon2.argon2id,
      memoryCost: 2 ** 14,  // 16 MB — lower than password since OTP is short-lived
      timeCost: 2,
      parallelism: 1,
    });

    const expiresAt = new Date(
      Date.now() + this.cfg.otp.expiresMinutes * 60 * 1000,
    );

    // Invalidate any existing unverified OTPs for this phone + purpose
    await this.prisma.otpVerification.updateMany({
      where: { phone, purpose, verified: false },
      data: { expiresAt: new Date() }, // expire immediately
    });

    await this.prisma.otpVerification.create({
      data: {
        userId,
        phone,
        codeHash,
        purpose,
        attempts: 0,
        verified: false,
        expiresAt,
      },
    });

    await this.msg91.sendOtp(phone, code);

    this.logger.debug({ phone, purpose }, 'OTP dispatched');

    return { expiresIn: this.cfg.otp.expiresMinutes * 60 };
  }

  /**
   * Verify an OTP code for the given phone and purpose.
   * Returns the OTP record ID on success; throws on failure.
   */
  async verifyOtp(
    phone: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<string> {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('OTP not found or expired. Please request a new one.');
    }

    if (!isDemoPhone(phone, this.cfg) && record.attempts >= this.cfg.otp.maxAttempts) {
      throw new BadRequestException(
        'Too many incorrect attempts. Please request a new OTP.',
      );
    }

    const isValid = await argon2.verify(record.codeHash, code);

    if (!isValid) {
      await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = this.cfg.otp.maxAttempts - (record.attempts + 1);
      throw new BadRequestException(
        `Invalid OTP. ${remaining} attempt(s) remaining.`,
      );
    }

    // Mark as verified
    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true, attempts: { increment: 1 } },
    });

    return record.id;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private resolveOtpCode(phone: string): string {
    if (isDemoPhone(phone, this.cfg)) {
      this.logger.log(
        { phone, otp: this.cfg.dev.demoOtp },
        '🔑 Demo OTP (development only)',
      );
      return this.cfg.dev.demoOtp;
    }
    return this.generateCode();
  }

  private generateCode(): string {
    const length = this.cfg.otp.length;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
  }

  private async enforceRateLimit(phone: string): Promise<void> {
    const key = REDIS_KEYS.otpRateLimit(phone);
    const windowSec = this.cfg.otp.rateLimitWindowMinutes * 60;
    const maxRequests = this.cfg.otp.rateLimitRequests;

    const current = await this.redis.incr(key);

    if (current === 1) {
      // First request in this window — set expiry
      await this.redis.expire(key, windowSec);
    }

    if (current > maxRequests) {
      const ttl = await this.redis.ttl(key);
      throw new HttpException(
        `Too many OTP requests. Please wait ${Math.ceil(ttl / 60)} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
