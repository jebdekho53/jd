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
exports.ListAdminPromotionsDto = exports.MerchantReplyDto = exports.ListPromotionsDto = exports.CreateCouponDto = exports.UpdateStorePromotionDto = exports.CreateStorePromotionDto = exports.ApplyCouponDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class ApplyCouponDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, minLength: 2 } };
    }
}
exports.ApplyCouponDto = ApplyCouponDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], ApplyCouponDto.prototype, "code", void 0);
class CreateStorePromotionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2 }, description: { required: false, type: () => String }, offerType: { required: true, type: () => Object }, target: { required: true, type: () => Object }, categoryId: { required: false, type: () => String }, productId: { required: false, type: () => String }, discountValue: { required: true, type: () => Number, minimum: 0 }, buyQuantity: { required: false, type: () => Number, minimum: 1 }, getQuantity: { required: false, type: () => Number, minimum: 1 }, minOrderAmount: { required: false, type: () => Number, minimum: 0 }, maxDiscount: { required: false, type: () => Number, minimum: 0 }, usageLimit: { required: false, type: () => Number, minimum: 1 }, startsAt: { required: true, type: () => String }, expiresAt: { required: true, type: () => String } };
    }
}
exports.CreateStorePromotionDto = CreateStorePromotionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateStorePromotionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStorePromotionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.PromotionOfferType),
    __metadata("design:type", String)
], CreateStorePromotionDto.prototype, "offerType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.PromotionTarget),
    __metadata("design:type", String)
], CreateStorePromotionDto.prototype, "target", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStorePromotionDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStorePromotionDto.prototype, "productId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateStorePromotionDto.prototype, "discountValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateStorePromotionDto.prototype, "buyQuantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateStorePromotionDto.prototype, "getQuantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateStorePromotionDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateStorePromotionDto.prototype, "maxDiscount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateStorePromotionDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateStorePromotionDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateStorePromotionDto.prototype, "expiresAt", void 0);
class UpdateStorePromotionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String }, description: { required: false, type: () => String }, discountValue: { required: false, type: () => Number, minimum: 0 }, minOrderAmount: { required: false, type: () => Number, minimum: 0 }, maxDiscount: { required: false, type: () => Number, minimum: 0 }, usageLimit: { required: false, type: () => Number }, startsAt: { required: false, type: () => String }, expiresAt: { required: false, type: () => String }, isActive: { required: false, type: () => Boolean } };
    }
}
exports.UpdateStorePromotionDto = UpdateStorePromotionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStorePromotionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStorePromotionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateStorePromotionDto.prototype, "discountValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateStorePromotionDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateStorePromotionDto.prototype, "maxDiscount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateStorePromotionDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateStorePromotionDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateStorePromotionDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateStorePromotionDto.prototype, "isActive", void 0);
class CreateCouponDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, minLength: 3 }, name: { required: true, type: () => String }, description: { required: false, type: () => String }, type: { required: true, type: () => Object }, kind: { required: false, type: () => Object }, scope: { required: true, type: () => Object }, sponsor: { required: false, type: () => Object }, storeId: { required: false, type: () => String }, categoryId: { required: false, type: () => String }, productId: { required: false, type: () => String }, discountValue: { required: true, type: () => Number, minimum: 0 }, maxDiscount: { required: false, type: () => Number, minimum: 0 }, minOrderAmount: { required: false, type: () => Number, minimum: 0 }, usageLimit: { required: false, type: () => Number, minimum: 1 }, perUserLimit: { required: false, type: () => Number, minimum: 1 }, firstOrderOnly: { required: false, type: () => Boolean }, startsAt: { required: true, type: () => String }, expiresAt: { required: true, type: () => String } };
    }
}
exports.CreateCouponDto = CreateCouponDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CouponType),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CouponKind),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "kind", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CouponScope),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OfferSponsor),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "sponsor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "productId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "discountValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "maxDiscount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "perUserLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCouponDto.prototype, "firstOrderOnly", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "expiresAt", void 0);
class ListPromotionsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1, maximum: 100 }, q: { required: false, type: () => String }, status: { required: false, type: () => Object } };
    }
}
exports.ListPromotionsDto = ListPromotionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListPromotionsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListPromotionsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListPromotionsDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListPromotionsDto.prototype, "status", void 0);
class MerchantReplyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reply: { required: true, type: () => String, minLength: 1 } };
    }
}
exports.MerchantReplyDto = MerchantReplyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], MerchantReplyDto.prototype, "reply", void 0);
class ListAdminPromotionsDto extends ListPromotionsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: false, type: () => String } };
    }
}
exports.ListAdminPromotionsDto = ListAdminPromotionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAdminPromotionsDto.prototype, "storeId", void 0);
//# sourceMappingURL=promotion.dto.js.map