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
var WebPushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebPushService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const web_push_1 = require("web-push");
let WebPushService = WebPushService_1 = class WebPushService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WebPushService_1.name);
        this.configured = false;
        this.publicKey = '';
        this.subject = 'mailto:support@jebdekho.com';
    }
    onModuleInit() {
        const publicKey = this.configService.get('WEB_PUSH_PUBLIC_KEY', '');
        const privateKey = this.configService.get('WEB_PUSH_PRIVATE_KEY', '');
        this.subject = this.configService.get('WEB_PUSH_SUBJECT', 'mailto:support@jebdekho.com');
        this.publicKey = publicKey;
        if (publicKey && privateKey) {
            web_push_1.default.setVapidDetails(this.subject, publicKey, privateKey);
            this.configured = true;
            this.logger.log('Web Push VAPID configured');
        }
        else {
            this.logger.warn('Web Push not configured — missing WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY');
        }
    }
    isConfigured() {
        return this.configured;
    }
    getPublicKey() {
        return this.publicKey;
    }
    async send(subscription, payload) {
        if (!this.configured) {
            return { statusCode: 503 };
        }
        const result = await web_push_1.default.sendNotification({
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, payload);
        return { statusCode: result.statusCode };
    }
};
exports.WebPushService = WebPushService;
exports.WebPushService = WebPushService = WebPushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WebPushService);
//# sourceMappingURL=web-push.service.js.map