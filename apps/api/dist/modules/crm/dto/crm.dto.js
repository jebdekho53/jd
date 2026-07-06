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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePushCampaignDto = exports.UpdatePreferencesDto = exports.TrackEventDto = exports.ListQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class ListQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 100 } };
    }
}
exports.ListQueryDto = ListQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListQueryDto.prototype, "limit", void 0);
class TrackEventDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { eventType: { required: true, type: () => Object }, sessionId: { required: false, type: () => String }, storeId: { required: false, type: () => String }, productId: { required: false, type: () => String }, orderId: { required: false, type: () => String }, metadata: { required: false, type: () => Object } };
    }
}
exports.TrackEventDto = TrackEventDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MarketingEventType),
    __metadata("design:type", typeof (_a = typeof client_1.MarketingEventType !== "undefined" && client_1.MarketingEventType) === "function" ? _a : Object)
], TrackEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TrackEventDto.prototype, "metadata", void 0);
class UpdatePreferencesDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { pushEnabled: { required: false, type: () => Boolean }, emailEnabled: { required: false, type: () => Boolean }, smsEnabled: { required: false, type: () => Boolean }, whatsappEnabled: { required: false, type: () => Boolean }, marketingConsent: { required: false, type: () => Boolean }, orderUpdates: { required: false, type: () => Boolean }, walletAlerts: { required: false, type: () => Boolean }, offerAlerts: { required: false, type: () => Boolean }, referralAlerts: { required: false, type: () => Boolean }, supportAlerts: { required: false, type: () => Boolean }, complianceAlerts: { required: false, type: () => Boolean } };
    }
}
exports.UpdatePreferencesDto = UpdatePreferencesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "pushEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "emailEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "smsEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "whatsappEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "marketingConsent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "orderUpdates", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "walletAlerts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "offerAlerts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "referralAlerts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "supportAlerts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePreferencesDto.prototype, "complianceAlerts", void 0);
class CreatePushCampaignDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, segmentId: { required: false, type: () => String }, templateCode: { required: true, type: () => String } };
    }
}
exports.CreatePushCampaignDto = CreatePushCampaignDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePushCampaignDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePushCampaignDto.prototype, "segmentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePushCampaignDto.prototype, "templateCode", void 0);
//# sourceMappingURL=crm.dto.js.map