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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackCampaignEventDto = exports.ListCampaignsDto = exports.UpdateCampaignDto = exports.CreateCampaignDto = exports.CreateOfferDto = exports.CampaignAudienceDto = exports.OfferRuleDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class OfferRuleDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { ruleType: { required: true, type: () => Object }, config: { required: true, type: () => Object } };
    }
}
exports.OfferRuleDto = OfferRuleDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.OfferRuleType),
    __metadata("design:type", String)
], OfferRuleDto.prototype, "ruleType", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], OfferRuleDto.prototype, "config", void 0);
class CampaignAudienceDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { audienceType: { required: true, type: () => Object }, config: { required: true, type: () => Object } };
    }
}
exports.CampaignAudienceDto = CampaignAudienceDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AudienceType),
    __metadata("design:type", String)
], CampaignAudienceDto.prototype, "audienceType", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CampaignAudienceDto.prototype, "config", void 0);
class CreateOfferDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, description: { required: false, type: () => String }, kind: { required: true, type: () => Object }, target: { required: false, type: () => Object }, storeId: { required: false, type: () => String }, categoryId: { required: false, type: () => String }, productId: { required: false, type: () => String }, variantId: { required: false, type: () => String }, discountValue: { required: true, type: () => Number, minimum: 0 }, cashbackAmount: { required: false, type: () => Number }, rewardPointsBonus: { required: false, type: () => Number }, buyQuantity: { required: false, type: () => Number }, getQuantity: { required: false, type: () => Number }, minOrderAmount: { required: false, type: () => Number }, maxDiscount: { required: false, type: () => Number }, usageLimit: { required: false, type: () => Number }, perUserLimit: { required: false, type: () => Number }, flashQtyLimit: { required: false, type: () => Number }, startsAt: { required: true, type: () => String }, expiresAt: { required: true, type: () => String }, priority: { required: false, type: () => Number }, rules: { required: false, type: () => [require("./campaign.dto").OfferRuleDto] } };
    }
}
exports.CreateOfferDto = CreateOfferDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.OfferKind),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "kind", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PromotionTarget),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "target", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "variantId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "discountValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "cashbackAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "rewardPointsBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "buyQuantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "getQuantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "maxDiscount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "perUserLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "flashQtyLimit", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OfferRuleDto),
    __metadata("design:type", Array)
], CreateOfferDto.prototype, "rules", void 0);
class CreateCampaignDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, description: { required: false, type: () => String }, stackMode: { required: false, type: () => Object }, startsAt: { required: true, type: () => String }, endsAt: { required: true, type: () => String }, budgetCap: { required: false, type: () => Number }, audiences: { required: false, type: () => [require("./campaign.dto").CampaignAudienceDto] }, offers: { required: false, type: () => [require("./campaign.dto").CreateOfferDto] } };
    }
}
exports.CreateCampaignDto = CreateCampaignDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OfferStackMode),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "stackMode", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCampaignDto.prototype, "budgetCap", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CampaignAudienceDto),
    __metadata("design:type", Array)
], CreateCampaignDto.prototype, "audiences", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateOfferDto),
    __metadata("design:type", Array)
], CreateCampaignDto.prototype, "offers", void 0);
class UpdateCampaignDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String }, description: { required: false, type: () => String }, stackMode: { required: false, type: () => Object }, startsAt: { required: false, type: () => String }, endsAt: { required: false, type: () => String }, budgetCap: { required: false, type: () => Number } };
    }
}
exports.UpdateCampaignDto = UpdateCampaignDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OfferStackMode),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "stackMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCampaignDto.prototype, "budgetCap", void 0);
class ListCampaignsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { scope: { required: false, type: () => Object }, status: { required: false, type: () => Object }, storeId: { required: false, type: () => String }, q: { required: false, type: () => String }, page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.ListCampaignsDto = ListCampaignsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CampaignScope),
    __metadata("design:type", String)
], ListCampaignsDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CampaignStatus),
    __metadata("design:type", String)
], ListCampaignsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListCampaignsDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListCampaignsDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListCampaignsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListCampaignsDto.prototype, "limit", void 0);
class TrackCampaignEventDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { campaignId: { required: true, type: () => String }, offerId: { required: false, type: () => String }, eventType: { required: true, type: () => Object } };
    }
}
exports.TrackCampaignEventDto = TrackCampaignEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackCampaignEventDto.prototype, "campaignId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackCampaignEventDto.prototype, "offerId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CampaignEventType),
    __metadata("design:type", String)
], TrackCampaignEventDto.prototype, "eventType", void 0);
//# sourceMappingURL=campaign.dto.js.map