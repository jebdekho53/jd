"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OtpService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const argon2 = require("argon2");
const prisma_service_1 = require("../../database/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const redis_constants_1 = require("../../redis/redis.constants");
const configuration_1 = require("../../config/configuration");
const secure_random_util_1 = require("../../common/utils/secure-random.util");
const msg91_service_1 = require("./msg91.service");
const whatsapp_service_1 = require("./whatsapp.service");
let OtpService = OtpService_1 = class OtpService {
    constructor(prisma, redis, msg91, whatsapp, configService) {
        this.prisma = prisma;
        this.redis = redis;
        this.msg91 = msg91;
        this.whatsapp = whatsapp;
        this.configService = configService;
        this.logger = new common_1.Logger(OtpService_1.name);
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    async requestOtp(phone, purpose, userId, options) {
        await this.enforceRateLimit(phone);
        const code = this.resolveOtpCode(phone);
        const codeHash = await argon2.hash(code, {
            type: argon2.argon2id,
            memoryCost: 2 ** 14,
            timeCost: 2,
            parallelism: 1,
        });
        const expiresAt = new Date(Date.now() + this.cfg.otp.expiresMinutes * 60 * 1000);
        await this.prisma.otpVerification.updateMany({
            where: { phone, purpose, verified: false },
            data: { expiresAt: new Date() },
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
        const sentViaWhatsApp = await this.whatsapp.sendOtp(phone, code);
        if (sentViaWhatsApp) {
            this.logger.debug({ phone, purpose }, 'OTP dispatched via WhatsApp');
        }
        else if (!options?.skipSms) {
            await this.msg91.sendOtp(phone, code);
        }
        else {
            this.logger.debug({ phone, purpose }, 'OTP SMS dispatch skipped');
        }
        this.logger.debug({ phone, purpose }, 'OTP dispatched');
        return { expiresIn: this.cfg.otp.expiresMinutes * 60, code };
    }
    async verifyOtp(phone, code, purpose) {
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
            throw new common_1.BadRequestException('OTP not found or expired. Please request a new one.');
        }
        if (record.attempts >= this.cfg.otp.maxAttempts) {
            throw new common_1.BadRequestException('Too many incorrect attempts. Please request a new OTP.');
        }
        const isValid = await argon2.verify(record.codeHash, code);
        if (!isValid) {
            await this.prisma.otpVerification.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            const remaining = this.cfg.otp.maxAttempts - (record.attempts + 1);
            throw new common_1.BadRequestException(`Invalid OTP. ${remaining} attempt(s) remaining.`);
        }
        await this.prisma.otpVerification.update({
            where: { id: record.id },
            data: { verified: true, attempts: { increment: 1 } },
        });
        return record.id;
    }
    resolveOtpCode(phone) {
        return this.generateCode();
    }
    generateCode() {
        return (0, secure_random_util_1.secureNumericCode)(this.cfg.otp.length);
    }
    async enforceRateLimit(phone) {
        const key = redis_constants_1.REDIS_KEYS.otpRateLimit(phone);
        const windowSec = this.cfg.otp.rateLimitWindowMinutes * 60;
        const maxRequests = this.cfg.otp.rateLimitRequests;
        const current = await this.redis.incr(key);
        if (current === 1) {
            await this.redis.expire(key, windowSec);
        }
        if (current > maxRequests) {
            const ttl = await this.redis.ttl(key);
            throw new common_1.HttpException(`Too many OTP requests. Please wait ${Math.ceil(ttl / 60)} minute(s).`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        msg91_service_1.Msg91Service,
        whatsapp_service_1.WhatsAppService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], OtpService);
//# sourceMappingURL=otp.service.js.map