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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsWebhookController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const shadowfax_webhook_service_1 = require("./shadowfax-webhook.service");
let LogisticsWebhookController = class LogisticsWebhookController {
    constructor(shadowfaxWebhook) {
        this.shadowfaxWebhook = shadowfaxWebhook;
    }
    async handleShadowfax(req, signature, altSignature, authorization) {
        const rawBody = req.rawBody;
        if (!rawBody) {
            throw new common_1.BadRequestException('Missing request body');
        }
        await this.shadowfaxWebhook.handlePayload(rawBody, signature ?? altSignature, authorization);
        return { success: true };
    }
};
exports.LogisticsWebhookController = LogisticsWebhookController;
__decorate([
    (0, common_1.Post)('shadowfax'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Shadowfax delivery status webhooks' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-shadowfax-signature')),
    __param(2, (0, common_1.Headers)('x-sfx-signature')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof common_1.RawBodyRequest !== "undefined" && common_1.RawBodyRequest) === "function" ? _a : Object, String, String, String]),
    __metadata("design:returntype", Promise)
], LogisticsWebhookController.prototype, "handleShadowfax", null);
exports.LogisticsWebhookController = LogisticsWebhookController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [shadowfax_webhook_service_1.ShadowfaxWebhookService])
], LogisticsWebhookController);
//# sourceMappingURL=logistics-webhook.controller.js.map