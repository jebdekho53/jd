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
var Msg91Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Msg91Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const configuration_1 = require("../../config/configuration");
const auth_constants_1 = require("./auth.constants");
let Msg91Service = Msg91Service_1 = class Msg91Service {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(Msg91Service_1.name);
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    async sendOtp(phone, otp) {
        if (!this.cfg.auth.smsEnabled) {
            this.logger.log({ phone }, auth_constants_1.SMS_WHATSAPP_DISABLED_LOG);
            return;
        }
        if (this.cfg.sms.provider === 'console') {
            this.logger.log({ phone, otp }, '🔑 OTP (console mode — NOT sent via SMS)');
            return;
        }
        if (!this.cfg.auth.msg91Enabled) {
            this.logger.log({ phone }, auth_constants_1.SMS_WHATSAPP_DISABLED_LOG);
            return;
        }
        await this.sendViaMSG91(phone, otp);
    }
    async sendTransactional(phone, message) {
        if (!this.cfg.auth.smsEnabled) {
            this.logger.log({ phone, message }, auth_constants_1.SMS_WHATSAPP_DISABLED_LOG);
            return;
        }
        if (this.cfg.sms.provider === 'console') {
            this.logger.log({ phone, message }, 'SMS (console mode)');
            return;
        }
        if (!this.cfg.auth.msg91Enabled) {
            this.logger.log({ phone, message }, auth_constants_1.SMS_WHATSAPP_DISABLED_LOG);
            return;
        }
        const mobile = phone.startsWith('+') ? phone.slice(1) : phone;
        const { authKey, senderId } = this.cfg.sms.msg91;
        try {
            const response = await axios_1.default.post('https://control.msg91.com/api/v5/flow/', {
                template_id: this.cfg.sms.msg91.templateId,
                short_url: '0',
                recipients: [{ mobiles: mobile, var: message }],
            }, {
                headers: {
                    authkey: authKey,
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
                timeout: 8000,
            });
            if (response.data?.type === 'error') {
                throw new Error(`MSG91 flow error: ${JSON.stringify(response.data)}`);
            }
            this.logger.log({ mobile }, 'Transactional SMS queued via MSG91');
        }
        catch (err) {
            this.logger.error({ err, mobile }, 'Failed to send transactional SMS');
            throw new Error('Failed to send SMS notification');
        }
    }
    async sendViaMSG91(phone, otp) {
        const { authKey, senderId, templateId, dltTeId } = this.cfg.sms.msg91;
        const mobile = phone.startsWith('+') ? phone.slice(1) : phone;
        const payload = {
            template_id: templateId,
            mobile,
            otp,
        };
        if (dltTeId) {
            payload['DLT_TE_ID'] = dltTeId;
        }
        try {
            const response = await axios_1.default.post('https://api.msg91.com/api/v5/otp', payload, {
                headers: {
                    authkey: authKey,
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
                timeout: 8000,
            });
            if (response.data?.type !== 'success') {
                throw new Error(`MSG91 returned non-success: ${JSON.stringify(response.data)}`);
            }
            this.logger.log({ mobile, msgId: response.data?.message }, 'OTP sent via MSG91');
        }
        catch (err) {
            this.logger.error({ err, mobile }, 'Failed to send OTP via MSG91');
            throw new Error('Failed to send OTP. Please try again.');
        }
    }
};
exports.Msg91Service = Msg91Service;
exports.Msg91Service = Msg91Service = Msg91Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Msg91Service);
//# sourceMappingURL=msg91.service.js.map